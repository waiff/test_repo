import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export function DeleteDocStoreModal({
  name,
  isOpen,
  setIsOpen,
  deleteDocStore,
}: {
  name: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  deleteDocStore: () => void;
}) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-1/30" aria-hidden="true" />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className="fixed inset-0 flex w-screen items-center justify-center">
            <Dialog.Panel
              as="div"
              className="w-[19.5rem] rounded-xl border border-gray-4 bg-white p-5 shadow-lg outline-none"
            >
              <div className="text-base font-bold leading-5 text-black">
                Are you sure you want to unlink {name}?
              </div>
              <div className="mt-2 text-sm text-gray-2">
                This will also remove any associated clauses.
              </div>
              <div className="flex justify-end pt-6">
                <div className="space-x-2">
                  <button
                    className="h-8 rounded-lg bg-gray-5 px-4 text-sm font-bold text-gray-1"
                    type="button"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="h-8 rounded-lg bg-feedback-error-extralight px-4 text-sm font-bold text-feedback-error-medium"
                    onClick={() => {
                      deleteDocStore();
                      setIsOpen(false);
                    }}
                  >
                    Unlink
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}
