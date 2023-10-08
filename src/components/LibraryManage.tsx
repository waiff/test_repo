import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { Spinner } from './Spinner';
import { ManageCard } from './LibraryManageCard';
import { useLibrary } from '../contexts/LibraryContext';
import { DocStoreType } from '../services/RallyApiService';
import { LoadingSpinner } from './LoadingSpinner';

export function LibraryManage() {
  const { docStores, createDocStore, isCreatingDocStore, isDocStoresLoading } =
    useLibrary();

  return (
    <div className="flex h-full flex-col overflow-y-hidden">
      <div className="flex items-center justify-between px-2 pb-6">
        <div className="text-xs font-bold text-gray-2">
          {docStores.reduce(
            (sum, docStore) => sum + docStore.numberOfDocuments,
            0,
          )}
          &nbsp;Documents
        </div>
        <button
          type="button"
          className="flex items-center space-x-2 rounded-lg bg-purple-2 px-3 py-1 font-bold text-purple-3"
          onClick={() => {
            createDocStore('New Document Source', DocStoreType.SPELLBOOK);
          }}
        >
          {isCreatingDocStore && <LoadingSpinner variant="small" />}
          <span>Add Documents</span>
        </button>
      </div>
      <div className="h-full space-y-4 overflow-y-auto px-2 pb-6">
        {isDocStoresLoading && !docStores.length ? (
          <Spinner /> // TODO: switch this out for a loading skeleton?
        ) : (
          <TransitionGroup component={null}>
            {docStores?.map((docStore) => (
              <CSSTransition
                key={docStore._id}
                classNames="fadescale"
                timeout={300}
              >
                <ManageCard docStore={docStore} />
              </CSSTransition>
            ))}
          </TransitionGroup>
        )}
      </div>
    </div>
  );
}
