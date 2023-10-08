import * as React from 'react';

export type HeaderProps = {
  /**
   * The title prop used for the image in the header (tooltip)
   */
  title: string;

  /**
   * The uri to the log image to use for the header
   */
  logo: string;
};

export function Header({ title, logo }: HeaderProps) {
  return (
    <section className="relative flex h-12 flex-col justify-center border-b border-gray-5 pl-2.5">
      <img
        src={logo}
        alt={title}
        title={title}
        className="h-[20px] w-[114px]"
      />
    </section>
  );
}
