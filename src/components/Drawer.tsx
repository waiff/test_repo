import { Dialog, Transition } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';
import { faXmark } from '@fortawesome/sharp-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export function Drawer({
  isOpen,
  setIsOpen,
  title,
  subtitle,
  children,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-30"
        onClose={() => setIsOpen(false)}
        onClick={(e: any) => {
          e.stopPropagation();
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-hidden">
          <div className="flex h-full items-end justify-center pt-2 text-center">
            <Transition.Child
              as={Fragment}
              enter="transition ease-out duration-500 transform"
              enterFrom="translate-y-[50vh]"
              enterTo="translate-y-0"
              leave="transition ease-in duration-200 transform"
              leaveFrom="translate-y-0"
              leaveTo="translate-y-full"
            >
              <Dialog.Panel className="relative flex h-[93vh] w-full max-w-lg flex-1 flex-col rounded-t-xl border border-[#b7b7b7] bg-white pt-6 text-left align-middle shadow-xl transition-all">
                <button
                  title="Close"
                  type="button"
                  className="absolute -top-4 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white p-3 text-xl text-gray-2 shadow-4 outline-none"
                  onClick={() => setIsOpen(false)}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
                <div className="mx-5 mb-5 flex flex-col space-y-4">
                  <Dialog.Title as="h3" className="text-xl font-bold leading-6">
                    {title}
                  </Dialog.Title>
                  {subtitle}
                </div>
                {subtitle && <hr className="bg-gray-6" />}
                <div className="h-full flex-1">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
