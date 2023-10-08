import { v4 as uuidv4 } from 'uuid';
import { Menu, Transition } from '@headlessui/react';
import {
  DotsThree,
  Files,
  ArrowsClockwise,
  TrashSimple,
} from '@phosphor-icons/react';
import { ReactNode, useState, Fragment, useEffect, useCallback } from 'react';
import { BasicTooltip } from './tooltip/Tooltip';

import googleDriveLogo from '../icons/library/googleDrive.svg';
import dropboxLogo from '../icons/library/dropbox.svg';
import spellbookLogo from '../icons/library/spellbook.svg';
import onedriveLogo from '../icons/library/onedrive.svg';
import { Drawer } from './Drawer';
import {
  DocStore,
  DocStoreSync,
  DocStoreSyncStatus,
  DocStoreType,
} from '../services/RallyApiService';
import { useLibrary } from '../contexts/LibraryContext';
import { DeleteDocStoreModal } from './LibraryDeleteDocStore';
import { LoadingSpinner } from './LoadingSpinner';

const FILE_EXAMPLES = [
  {
    id: uuidv4(),
    filename: 'Non_Disclosure_Agreement.docx',
    date: '2022-01-15',
  },
  {
    id: uuidv4(),
    filename: 'Employment_Contract.docx',
    date: '2022-01-05',
  },
  {
    id: uuidv4(),
    filename: 'Lease_Agreement.docx',
    date: '2022-01-20',
  },
  {
    id: uuidv4(),
    filename: 'Partnership_Agreement.docx',
    date: '2022-01-25',
  },
  {
    id: uuidv4(),
    filename: 'Sales_Contract.docx',
    date: '2022-01-26',
  },
  {
    id: uuidv4(),
    filename: 'Intellectual_Property_Assignment_Agreement.docx',
    date: '2022-02-01',
  },
  {
    id: uuidv4(),
    filename: 'Confidentiality_and_Non_Competition_Agreement.docx',
    date: '2022-02-02',
  },
  {
    id: uuidv4(),
    filename: 'Software_Licensing_Agreement.docx',
    date: '2022-02-03',
  },
  {
    id: uuidv4(),
    filename: 'Real_Estate_Purchase_Agreement.docx',
    date: '2022-02-04',
  },
  {
    id: uuidv4(),
    filename: 'Shareholder_Agreement.docx',
    date: '2022-02-05',
  },
  {
    id: uuidv4(),
    filename: 'Joint_Venture_Agreement.docx',
    date: '2022-02-06',
  },
  {
    id: uuidv4(),
    filename: 'Merger_and_Acquisition_Agreement.docx',
    date: '2022-02-07',
  },
  {
    id: uuidv4(),
    filename: 'Distribution_Agreement.docx',
    date: '2022-02-08',
  },
  {
    id: uuidv4(),
    filename: 'Franchise_Agreement.docx',
    date: '2022-02-09',
  },
  {
    id: uuidv4(),
    filename: 'Consulting_Services_Agreement.docx',
    date: '2022-02-10',
  },
];

export function ManageDrawer({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  return (
    <Drawer isOpen={isOpen} setIsOpen={setIsOpen} title="Spellbook">
      <div className="h-full px-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-gray-2">
            {FILE_EXAMPLES.length} Documents
          </div>
        </div>
        <hr className="mt-4 bg-gray-6" />
        <div className="-mr-2 h-full overflow-auto pb-24">
          {FILE_EXAMPLES.map((file) => (
            <>
              <div
                className="group flex items-center justify-between py-3"
                key={file.id}
              >
                <div className="w-3/4">
                  <p className="truncate pb-1 font-bold">{file.filename}</p>
                  <p className="text-sm text-gray-2">
                    {new Date(file.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="mx-3 hidden group-hover:block">
                  <BasicTooltip tooltip="Delete">
                    <TrashSimple size={20} weight="bold" />
                  </BasicTooltip>
                </div>
              </div>
              <hr className="bg-gray-6" />
            </>
          ))}
        </div>
      </div>
    </Drawer>
  );
}

export function getLogo(docStore: DocStoreType) {
  switch (docStore) {
    case DocStoreType.DROPBOX:
      return dropboxLogo;
    case DocStoreType.GOOGLE_DRIVE:
      return googleDriveLogo;
    case DocStoreType.SPELLBOOK:
      return spellbookLogo;
    case DocStoreType.ONE_DRIVE:
      return onedriveLogo;
    default:
      return undefined;
  }
}

function MenuItem({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Menu.Item>
      <button
        type="button"
        className="w-full rounded p-1 pr-2 text-left text-xs ui-active:bg-gray-6"
        onClick={onClick}
      >
        {children}
      </button>
    </Menu.Item>
  );
}

export function ManageCard({
  docStore: {
    _id,
    name,
    documentStoreType: type,
    numberOfDocuments: numDocs,
    lastSyncedAt,
  },
}: {
  docStore: DocStore;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncObject, setSyncObject] = useState<DocStoreSync | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(name === 'New Document Source');
  const [editedName, setEditedName] = useState(name);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    uploadDocStoreFiles,
    deleteDocStore,
    updateDocStore,
    startSync,
    getSync,
    cancelSync: cancelSyncApi,
  } = useLibrary();

  useEffect(() => {
    let intervalId: NodeJS.Timer;

    if (syncing && syncObject) {
      intervalId = setInterval(() => {
        getSync(_id, syncObject._id).then((newSync) => {
          setSyncObject(newSync);

          // TODO: update what happens once we have real syncing happening
          switch (newSync.status) {
            case DocStoreSyncStatus.PENDING:
              break;
            case DocStoreSyncStatus.IN_PROGRESS:
              setProgress(newSync.numProcessed / numDocs);
              break;
            case DocStoreSyncStatus.COMPLETED:
              setSyncing(false);
              setProgress(0);
              setSyncObject(null);
              break;
            case DocStoreSyncStatus.CANCELLED:
            case DocStoreSyncStatus.FAILED:
              setSyncing(false);
              setSyncObject(null);
              break;
            default:
              break;
          }
        });
      }, 1000); // TODO: tune frequency of requests
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [syncing, _id, getSync, numDocs, syncObject]);

  const syncDocs = async () => {
    setSyncing(true);
    const sync = await startSync(_id);
    setSyncObject(sync);

    if (numDocs === 0) {
      setProgress(0);
    } else {
      setProgress(sync.numProcessed / numDocs);
    }
  };

  const cancelSync = async () => {
    setSyncing(false);
    if (syncObject?._id) {
      await cancelSyncApi(_id, syncObject._id);
      setSyncObject(null);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditedName(name);
    setErrorMessage('');
  };

  const handleSave = useCallback(async () => {
    if (editedName.trim() === '') {
      setErrorMessage('Name is required');
      return;
    }

    await updateDocStore(_id, editedName);
    setEditing(false);
    setErrorMessage('');
  }, [editedName, _id, updateDocStore]);

  return (
    <>
      <div className="flex flex-col rounded-xl border border-gray-3 p-3">
        <div className="flex items-center justify-between">
          <div className="flex w-full items-center">
            <img
              src={getLogo(type)}
              className="inline-block h-8 w-8 pr-2"
              alt={`${type} Logo`}
            />
            {editing ? (
              <input
                className="mr-4 grow cursor-text rounded border border-gray-4 px-2 py-1 font-bold outline-none focus:border-blue-1"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                aria-label="Edit Name"
              />
            ) : (
              <span className="pb-1 font-bold">{name}</span>
            )}
          </div>
          <div>
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button
                className="inline-flex w-full justify-center rounded-md bg-white px-2 py-1 text-sm font-medium hover:bg-gray-6 focus:outline-none"
                onClick={(e: any) => {
                  e.stopPropagation();
                }}
              >
                <DotsThree
                  size={20}
                  weight="bold"
                  className="text-base font-bold text-gray-2 group-hover/button:text-purple-1"
                />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-1 w-20 origin-top-right cursor-pointer rounded-md border border-gray-3 bg-white shadow-lg focus:outline-none">
                  <div className="p-1">
                    <MenuItem
                      onClick={() => {
                        setEditing(true);
                      }}
                    >
                      Edit
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setDrawerOpen(true);
                      }}
                    >
                      List Files
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setDeleteModalOpen(true);
                      }}
                    >
                      Delete
                    </MenuItem>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
        {errorMessage ? (
          <p className="my-2 text-feedback-error-medium">{errorMessage}</p>
        ) : (
          <hr
            className="-mx-3 my-2 h-1 bg-rally-gradient transition-[width]"
            style={{
              width: `calc(${progress}% + (${progress}/100 * 0.75*2rem))`,
            }}
          />
        )}
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-2">
            <BasicTooltip
              tooltip={`${numDocs} File${numDocs !== 1 ? 's' : ''} Processed`}
            >
              <div className="flex items-center">
                <Files size={20} weight="bold" className="inline-block" />
                <span className="ml-1">{numDocs}</span>
              </div>
            </BasicTooltip>
          </div>
          <div className="space-x-2">
            {editing ? (
              <>
                <button
                  type="button"
                  className="rounded px-2 py-1 font-bold"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded bg-rally-gradient px-2 py-1 font-bold text-white"
                  onClick={handleSave}
                >
                  Save
                </button>
              </>
            ) : (
              <>
                {type === DocStoreType.SPELLBOOK ? (
                  <>
                    <span className="mr-1 text-xs text-gray-1">
                      {new Date(lastSyncedAt).toLocaleDateString()}
                    </span>
                    <input
                      type="file"
                      multiple
                      id={_id}
                      className="hidden"
                      accept=".doc, .docx"
                      onChange={(event: any) => {
                        setUploading(true);
                        uploadDocStoreFiles(event.target.files, _id).then(
                          () => {
                            // eslint-disable-next-line no-param-reassign
                            event.target.value = null; // allows you to select same files again
                            setUploading(false);
                          },
                        );
                      }}
                    />
                    <button
                      type="button"
                      className="inline-flex items-center space-x-1 rounded-lg bg-purple-2 px-3 py-1 font-bold text-purple-3 disabled:cursor-not-allowed"
                      disabled={uploading}
                      onClick={() => {
                        const inputElement = document.getElementById(_id);
                        if (inputElement) inputElement.click();
                      }}
                    >
                      {uploading ? (
                        <div className="mx-3 h-full translate-y-0.5 align-middle">
                          <LoadingSpinner />
                        </div>
                      ) : (
                        <span>Upload</span>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    {syncing ? (
                      <>
                        <span className="text-xs text-gray-1">
                          Sync in progress...
                        </span>
                        <button
                          type="button"
                          className="inline-flex items-center space-x-1 rounded-lg bg-gray-5 px-3 py-1 font-bold text-gray-2 disabled:cursor-not-allowed"
                          onClick={cancelSync}
                          disabled={!syncObject}
                        >
                          {syncObject ? (
                            <span>Cancel</span>
                          ) : (
                            <div className="mx-3 h-full translate-y-0.5 align-middle">
                              <LoadingSpinner />
                            </div>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-gray-1">
                          {new Date(lastSyncedAt).toLocaleDateString(
                            undefined,
                            {
                              month: 'short',
                              day: 'numeric',
                            },
                          )}
                        </span>
                        <button
                          type="button"
                          className="inline-flex items-center space-x-1 rounded-lg bg-purple-2 px-3 py-1 font-bold text-purple-3"
                          onClick={syncDocs}
                        >
                          <span>Sync</span>
                          <ArrowsClockwise size={15} weight="bold" />
                        </button>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <ManageDrawer isOpen={drawerOpen} setIsOpen={setDrawerOpen} />
      <DeleteDocStoreModal
        name={name}
        isOpen={deleteModalOpen}
        deleteDocStore={() => deleteDocStore(_id)}
        setIsOpen={setDeleteModalOpen}
      />
    </>
  );
}
