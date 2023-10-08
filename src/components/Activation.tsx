import { faSpinner } from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useSpellbookUser } from '../contexts/SpellbookUserContext';
import { useRallyApi } from '../hooks/useRallyApi';
import { handleException } from '../utils/ErrorUtils';

type ActivationProps = {
  trialExpired: boolean;
};

export function Activation({ trialExpired = false }: ActivationProps) {
  const { identifyUser, setShowActivation } = useSpellbookUser();
  const { register, handleSubmit } = useForm({
    defaultValues: { licenseKey: '' },
  });
  const { activate } = useRallyApi();

  const [isActivating, setIsActivating] = useState<boolean>(false);
  // @ts-ignore FIX-ME
  const [errorMessage, setErrorMessage] = useState<string>(null);

  const onSubmit = useCallback(
    async ({ licenseKey }) => {
      setIsActivating(true);
      // @ts-ignore FIX-ME
      setErrorMessage(null);
      try {
        const { activated } = await activate(licenseKey.trim());
        if (activated) {
          // @ts-ignore FIX-ME
          await identifyUser();
          setShowActivation(false);
        }
      } catch (error) {
        if (
          // @ts-ignore FIX-ME
          error.response?.data?.message &&
          // @ts-ignore FIX-ME
          error.response.data.message.match(/license not found/i)
        ) {
          setErrorMessage('Invalid license key. Please try again.');
          return;
        }

        setErrorMessage('Something went wrong. Please try again later.');
        handleException(error);
      } finally {
        setIsActivating(false);
      }
    },
    [activate, identifyUser, setShowActivation],
  );

  return (
    <div className="mt-5 flex flex-col p-10">
      <div className="mb-10">
        <h1 className="mb-5 text-2xl">Activate Spellbook</h1>
        {trialExpired && (
          <div className="mb-5">
            Your trial has expired! Please activate below to continue.
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-5 flex flex-col">
            <label htmlFor="license-key">
              <span className="mb-2 block text-sm font-bold text-gray-700">
                License Key
              </span>
              <div className="relative flex items-center justify-end">
                <input
                  id="license-key"
                  className={`w-full appearance-none rounded border py-2 pl-3 pr-6 leading-tight text-gray-700 shadow ${
                    !!errorMessage && 'border-red-100'
                  }`}
                  type="text"
                  placeholder="Enter your license key"
                  {...register('licenseKey', {
                    required: true,
                    disabled: isActivating,
                    validate: (v) => !!v?.trim(),
                  })}
                />
                {isActivating && (
                  <div className="absolute mr-2">
                    <FontAwesomeIcon icon={faSpinner} pulse />
                  </div>
                )}
              </div>
            </label>

            {!!errorMessage && (
              <div className="mt-5 rounded bg-red-100 p-2">{errorMessage}</div>
            )}
          </div>
          <div className="mb-12 flex items-center justify-between">
            <button
              className="rounded bg-purple-1 px-4 py-2 font-bold text-white focus:outline-none"
              type="submit"
              disabled={isActivating}
            >
              Activate
            </button>
            {!trialExpired && (
              <button
                className="inline-block align-baseline text-sm font-bold text-gray-1 hover:text-gray-2"
                type="button"
                onClick={() => setShowActivation(false)}
                disabled={isActivating}
              >
                Skip
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="text-center text-gray-2">
        <p>Don&apos;t have a license key?</p>{' '}
        <div className="mt-4">
          <a
            className="rounded bg-purple-1 px-4 py-2 font-bold text-white focus:outline-none"
            href="https://spellbook.typeform.com/to/NefmV9vh"
          >
            Request Access
          </a>
        </div>
      </div>
    </div>
  );
}
