export const SIZES = {
  '8xl': [
    'text-9xl/[8rem] sm:text-8xl/[7rem]' /* 128px/128px sm:96px/112px */,
    '[&>[data-slot=text-code]]:text-8xl/[7rem] [&>[data-slot=text-code]]:sm:sm:text-7xl/[6rem]' /* 96px/112px sm:72px/96px */,
    '[&>[data-slot=text-code]]:rounded-xl [&>[data-slot=text-code]]:px-3',
  ],
  '7xl': [
    'text-8xl/[7rem] sm:text-7xl/[6rem]' /* 96px/112px sm:72px/96px */,
    '[&>[data-slot=text-code]]:text-7xl/[6rem] [&>[data-slot=text-code]]:sm:text-6xl/[5rem]' /* 72px/96px sm:60px/80px */,
    '[&>[data-slot=text-code]]:rounded-xl [&>[data-slot=text-code]]:px-2.5',
  ],
  '6xl': [
    'text-7xl/[6rem] sm:text-6xl/[5rem]' /* 72px/96px sm:60px/80px */,
    '[&>[data-slot=text-code]]:text-6xl/[5rem] [&>[data-slot=text-code]]:sm:text-5xl/[4rem]' /* 60px/80px sm:48px/64px */,
    '[&>[data-slot=text-code]]:rounded-lg [&>[data-slot=text-code]]:px-2',
  ],
  '5xl': [
    'text-6xl/[5rem] sm:text-5xl/[4rem]' /* 60px/80px sm:48px/64px */,
    '[&>[data-slot=text-code]]:text-5xl/[4rem] [&>[data-slot=text-code]]:sm:text-4xl/[3rem]' /* 48px/64px sm:36px/48px */,
    '[&>[data-slot=text-code]]:rounded-lg [&>[data-slot=text-code]]:px-1.5',
  ],
  '4xl': [
    'text-5xl/[4rem] sm:text-4xl/[3rem]' /* 48px/64px sm:36px/48px */,
    '[&>[data-slot=text-code]]:text-4xl/[3rem] [&>[data-slot=text-code]]:sm:text-3xl/10' /* 36px/48px sm:30px/40px */,
    '[&>[data-slot=text-code]]:rounded-md [&>[data-slot=text-code]]:px-1.5',
  ],
  '3xl': [
    'text-4xl/[3rem] sm:text-3xl/10' /* 36px/48px sm:30px/40px */,
    '[&>[data-slot=text-code]]:text-3xl/10 [&>[data-slot=text-code]]:sm:text-2xl/9' /* 30px/40px sm:24px/36px */,
    '[&>[data-slot=text-code]]:rounded-md [&>[data-slot=text-code]]:px-1.5',
  ],
  '2xl': [
    'text-3xl/10 sm:text-2xl/9' /* 30px/40px sm:24px/36px */,
    '[&>[data-slot=text-code]]:text-2xl/9 [&>[data-slot=text-code]]:sm:text-xl/8' /* 24px/36px sm:20px/32px */,
    '[&>[data-slot=text-code]]:rounded-md [&>[data-slot=text-code]]:px-1',
  ],
  xl: [
    'text-2xl/9 sm:text-xl/8' /* 24px/36px sm:20px/32px */,
    '[&>[data-slot=text-code]]:text-xl/8 [&>[data-slot=text-code]]:sm:text-lg/7' /* 20px/32px sm:18px/28px */,
    '[&>[data-slot=text-code]]:rounded-md [&>[data-slot=text-code]]:px-1',
  ],
  lg: [
    'text-xl/8 sm:text-lg/7' /* 20px/32px sm:18px/28px */,
    '[&>[data-slot=text-code]]:text-lg/7 [&>[data-slot=text-code]]:sm:text-base/6' /* 18px/28px sm:16px/24px */,
    '[&>[data-slot=text-code]]:rounded [&>[data-slot=text-code]]:px-1',
  ],
  md: [
    'text-lg/7 sm:text-base/6' /* 18px/28px sm:16px/24px */,
    '[&>[data-slot=text-code]]:text-base/6 [&>[data-slot=text-code]]:sm:text-sm/5' /* 16px/24px sm:14px/20px */,
    '[&>[data-slot=text-code]]:rounded [&>[data-slot=text-code]]:px-0.5',
  ],
  sm: [
    'text-base/6 sm:text-sm/5' /* 16px/24px sm:14px/20px */,
    '[&>[data-slot=text-code]]:text-sm/5 [&>[data-slot=text-code]]:sm:text-xs/4' /* 14px/20px sm:12px/16px */,
    '[&>[data-slot=text-code]]:rounded [&>[data-slot=text-code]]:px-0.5',
  ],
  xs: [
    'text-sm/5 sm:text-xs/4' /* 14px/20px sm:12px/16px */,
    '[&>[data-slot=text-code]]:text-xs/4 [&>[data-slot=text-code]]:sm:text-[10px]/3' /* 12px/16px sm:10px/12px */,
    '[&>[data-slot=text-code]]:rounded [&>[data-slot=text-code]]:px-0.5',
  ],
}

export const WEIGHTS = {
  '4xl': 'font-black [&>[data-slot=text-strong]]:font-black',
  '3xl': 'font-extrabold [&>[data-slot=text-strong]]:font-black',
  '2xl': 'font-bold [&>[data-slot=text-strong]]:font-extrabold',
  xl: 'font-semibold [&>[data-slot=text-strong]]:font-bold',
  lg: 'font-medium [&>[data-slot=text-strong]]:font-semibold',
  md: 'font-normal [&>[data-slot=text-strong]]:font-medium',
  sm: 'font-light [&>[data-slot=text-strong]]:font-normal',
  xs: 'font-extralight [&>[data-slot=text-strong]]:font-light',
  '2xs': 'font-thin [&>[data-slot=text-strong]]:font-extralight',
}
