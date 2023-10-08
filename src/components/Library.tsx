import { useCallback, ReactNode } from 'react';
import {
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { LibraryManage } from './LibraryManage';
import { LibrarySearch } from './LibrarySearch';

function PageLink({
  to,
  active,
  disabled,
  children,
}: {
  to: string;
  active: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  const handleClick = useCallback(
    (e: { preventDefault: () => void }) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      navigate(to);
    },
    [disabled, navigate, to],
  );

  return (
    <NavLink
      to={to}
      className={`${disabled ? 'cursor-default text-gray-2' : 'text-gray-1'} 
      ${active ? 'font-bold' : 'text-black'}`}
      onClick={handleClick}
    >
      {children}
    </NavLink>
  );
}

export function Library() {
  const { page } = useParams();
  const activePage = page === 'manage' ? 'manage' : 'search';

  return (
    <>
      <div className="mx-2 flex flex-col pt-4">
        <div className="mb-1 flex space-x-4 text-gray-1">
          <PageLink
            to="/taskpane/library/search"
            active={activePage === 'search'}
          >
            Search
          </PageLink>
          <PageLink
            to="/taskpane/library/manage"
            active={activePage === 'manage'}
          >
            Manage
          </PageLink>
        </div>
        <hr className="mb-4 bg-gray-6" />
      </div>
      <Routes>
        <Route index element={<LibrarySearch />} />
        <Route path="search" element={<LibrarySearch />} />
        <Route path="manage" element={<LibraryManage />} />
      </Routes>
    </>
  );
}
