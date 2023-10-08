import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment, ReactNode, useRef } from 'react';

function Dropdown<T = string>({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: T;
  onChange: (e: T) => void;
  children?: ReactNode;
}) {
  const optionsRef = useRef<HTMLDivElement | null>(null);

  return (
    <div>
      <Listbox as="div" className="relative" value={value} onChange={onChange}>
        <Listbox.Label className="mb-1 block pl-1 text-xs text-gray-2">
          {label}
        </Listbox.Label>
        <Listbox.Button className="flex min-w-[128px] items-center rounded-full border border-gray-4 px-3 py-1 text-xs">
          {value}
          <FontAwesomeIcon
            icon={faChevronDown}
            className="ml-auto text-[10px] text-gray-2"
          />
        </Listbox.Button>
        <div ref={optionsRef}>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
            afterEnter={() =>
              optionsRef.current?.scrollIntoView({
                block: 'start',
                behavior: 'smooth',
              })
            }
          >
            <Listbox.Options className="absolute z-10 mt-1 min-w-[110px] cursor-pointer overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black/5 focus:outline-none">
              {children}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}

function DropdownItem<T = string>({
  value,
  label,
  disabled,
  ...props
}: {
  value: T;
  label: string | JSX.Element;
  disabled?: boolean;
  props?: any;
}) {
  return (
    <Listbox.Option
      value={value}
      disabled={!!disabled}
      className={`px-4 py-2 hover:bg-gray-6 ${
        disabled ? 'cursor-not-allowed text-gray-3 hover:bg-white' : ''
      }`}
      {...props}
    >
      {label}
    </Listbox.Option>
  );
}

Dropdown.Item = DropdownItem;

export default Dropdown;
