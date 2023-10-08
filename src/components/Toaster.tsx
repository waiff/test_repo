import 'react-toastify/dist/ReactToastify.css';

import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faCircleXmark,
} from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { ToastContainer } from 'react-toastify';

const IconsForType = {
  info: faCircleInfo,
  success: faCircleCheck,
  error: faCircleXmark,
  warning: faCircleExclamation,
};

function ToasterIcon({ type }: { type: string }) {
  // @ts-ignore  FIX-ME
  if (IconsForType[type]) {
    // @ts-ignore  FIX-ME
    return <FontAwesomeIcon icon={IconsForType[type]} />;
  }
  return null;
}

export function Toaster() {
  return (
    <ToastContainer
      icon={ToasterIcon}
      hideProgressBar
      newestOnTop={false}
      closeOnClick
      rtl={false}
      enableMultiContainer
      pauseOnFocusLoss={false}
      theme="colored"
      draggable
      pauseOnHover
      closeButton={false}
    />
  );
}
