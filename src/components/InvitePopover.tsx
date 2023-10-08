import { useState, useEffect, Fragment } from 'react';
import { faUserPlus } from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useDebouncedCallback } from 'use-debounce';
import { useFeatureToggle, useFlagVariation } from '@flopflip/react-broadcast';
import { Gift } from '@phosphor-icons/react';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useAuthentication } from '../contexts/AuthenticationContext';
import { useRallyApi } from '../hooks/useRallyApi';
import { Checkbox } from './Checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip/Tooltip';

export function InvitePopover() {
  type FormData = {
    name: string;
    email: string;
    isSameOrg: boolean;
  };

  const formId = useFlagVariation('spellbookInvitationTypeformId');
  const { user } = useAuthentication();
  const { trackEvent } = useAnalytics();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>();
  const { submitInvitation, fetchInvitationCount, deprecateInvitationCount } =
    useRallyApi();

  const [open, setOpen] = useState(false);
  const [invitationCount, setInvitationCount] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);

  const isClauseLibraryEnabled = useFeatureToggle('clauseLibrary');

  const watchedValues = watch();
  const watchedName = watchedValues.name;
  const watchedEmail = watchedValues.email;
  const inviterName = user?.name;
  const inviterEmail = user?.email;

  const debouncedFormSubmission = useDebouncedCallback(
    async (formData: FormData, close: () => void) => {
      setIsLoading(true);

      try {
        await submitInvitation(
          formData.email,
          formData.name,
          !!formData.isSameOrg,
          inviterEmail,
          inviterName,
        );
        trackEvent?.('Invitation Form Submitted');
        setInvitationCount(await deprecateInvitationCount());
        toast.success('Thank you! Invitation sent.');

        if (!errors.name && !errors.email) {
          close();
        }
      } catch (error) {
        trackEvent?.('Invitation Form Submission Failed');
        toast.error('Something went wrong. Please try again later.');
      } finally {
        reset();
        setIsLoading(false);
      }
    },
    300,
  );

  const onSubmit = (close: () => void) => (formData: FormData) => {
    debouncedFormSubmission(formData, close);
  };

  useEffect(() => {
    async function updateInvitationCount() {
      setInvitationCount(await fetchInvitationCount());
    }
    updateInvitationCount();
  }, [fetchInvitationCount]);

  if (!formId || !invitationCount) {
    return null;
  }

  return (
    <>
      <Tooltip placement="top">
        <TooltipTrigger>
          {isClauseLibraryEnabled ? (
            <button
              type="button"
              onClick={() => {
                trackEvent?.('Invitation Form Opened');
                setOpen(true);
              }}
              className="relative flex cursor-pointer focus:outline-none"
              title={`You have ${invitationCount} invitations remaining`}
            >
              <span className="flex items-center justify-center gap-1 no-underline">
                <Gift size={19} />
                Invite
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                trackEvent?.('Invitation Form Opened');
                setOpen(true);
              }}
              className="relative mr-2 flex cursor-pointer items-center justify-center rounded-[5px] bg-rally-gradient px-2 py-1 leading-[13px] text-white shadow focus:outline-none"
              title={`You have ${invitationCount} invitations remaining`}
            >
              <span className="flex items-center text-[13px]">
                <FontAwesomeIcon icon={faUserPlus} className="mr-1" />
                Invite
              </span>
              <span className="absolute right-[-6px] top-[-6px] flex h-4 w-4 items-center justify-center rounded-full border border-white bg-red-500 text-xs">
                {invitationCount}
              </span>
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent>
          You have {invitationCount} invitations remaining
        </TooltipContent>
      </Tooltip>
      <Transition appear show={open} as={Fragment}>
        <Dialog onClose={() => setOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-1/30" aria-hidden="true" />
          </Transition.Child>
          <div className="fixed inset-0 flex w-screen items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                as="div"
                className="w-[19.5rem] rounded-xl border border-gray-4 bg-white shadow-lg outline-none"
              >
                <form onSubmit={handleSubmit(onSubmit(() => setOpen(false)))}>
                  <div className="p-6">
                    <div className="text-base font-bold leading-5 text-black">
                      Invite a colleague or friend to try Spellbook
                    </div>
                    <div className="mt-2 text-sm text-gray-2">
                      They will skip to the front of our 30,000+ person
                      waitlist.
                    </div>
                    <div className="mt-6">
                      <textarea
                        id="name"
                        {...register('name', { required: 'Name is required' })}
                        className={`w-full resize-none rounded-lg border ${
                          errors.name
                            ? 'border-feedback-error-medium'
                            : 'border-gray-5 focus:border-blue-1'
                        } px-3 py-2 text-sm outline-none`}
                        placeholder="Their Name"
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                        rows={1}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                          }
                        }}
                      />
                      {errors.name && (
                        <div className="mt-0.5 text-xs text-feedback-error-medium">
                          {errors.name.message}
                        </div>
                      )}
                      <textarea
                        id="email"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                            message: 'Invalid email address',
                          },
                        })}
                        className={`mt-3 w-full resize-none rounded-lg border ${
                          errors.email
                            ? 'border-feedback-error-medium'
                            : 'border-gray-5 focus:border-blue-1'
                        } px-3 py-2 text-sm outline-none`}
                        placeholder="Their Email"
                        rows={1}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                          }
                        }}
                      />
                      {errors.email && (
                        <div className="mt-0.5 text-xs text-feedback-error-medium">
                          {errors.email.message}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <Tooltip placement="bottom">
                        <TooltipTrigger>
                          <Checkbox
                            id="isSameOrg"
                            label="Same Organization?"
                            value="isSameOrg"
                            {...register('isSameOrg')}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          Does this person belong to your organization?
                        </TooltipContent>
                      </Tooltip>
                      <button
                        type="submit"
                        disabled={
                          !watchedName ||
                          !watchedEmail ||
                          !!errors.name ||
                          !!errors.email ||
                          isLoading
                        }
                        className="h-8 rounded-full px-4 text-base text-white shadow-4 transition-all duration-150 enabled:bg-rally-gradient enabled:hover:translate-y-[-2px] enabled:hover:shadow-5 enabled:active:translate-y-0 enabled:active:shadow-none disabled:bg-gray-4 disabled:shadow-none"
                      >
                        {isLoading ? 'Sending...' : 'Invite'}
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
