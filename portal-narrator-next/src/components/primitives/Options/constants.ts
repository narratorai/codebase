export const OPTION_STYLE = [
  // Base styles
  // 'group cursor-default px-3.5 py-2.5 focus:outline-none sm:px-3 sm:py-1.5',
  'group cursor-pointer focus:outline-none w-full block',
  // Text styles
  'text-left text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white forced-colors:text-[CanvasText]',
  // Focus
  'data-[focus]:bg-indigo-500 data-[focus]:text-white',
  // Disabled state
  'data-[disabled]:opacity-50 disabled:opacity-50',
  // Forced colors mode
  'forced-color-adjust-none forced-colors:data-[focus]:bg-[Highlight] forced-colors:data-[focus]:text-[HighlightText] forced-colors:[&>[data-slot=icon]]:data-[focus]:text-[HighlightText]',
  // Use subgrid when available but fallback to an explicit grid layout if not
  // 'col-span-full grid grid-cols-[auto_1fr_1.5rem_0.5rem_auto] items-center supports-[grid-template-columns:subgrid]:grid-cols-subgrid',
  // Icons
  // '[&>[data-slot=icon]]:col-start-1 [&>[data-slot=icon]]:row-start-1 [&>[data-slot=icon]]:-ml-0.5 [&>[data-slot=icon]]:mr-2.5 [&>[data-slot=icon]]:size-5 sm:[&>[data-slot=icon]]:mr-2 [&>[data-slot=icon]]:sm:size-4',
  // '[&>[data-slot=icon]]:text-zinc-500 [&>[data-slot=icon]]:data-[focus]:text-white [&>[data-slot=icon]]:dark:text-zinc-400 [&>[data-slot=icon]]:data-[focus]:dark:text-white',
  // Avatar
  // '[&>[data-slot=avatar]]:-ml-1 [&>[data-slot=avatar]]:mr-2.5 [&>[data-slot=avatar]]:size-6 sm:[&>[data-slot=avatar]]:mr-2 sm:[&>[data-slot=avatar]]:size-5',
  // Selection
  // '[&>[data-slot=selection]]:col-start-5 [&>[data-slot=selection]]:row-start-1 [&>[data-slot=selection]]:invisible [&>[data-slot=selection]]:size-5 [&>[data-slot=selection]]:self-center [&>[data-slot=selection]]:stroke-current [&>[data-slot=selection]]:data-[selected]:visible [&>[data-slot=selection]]:sm:size-4',
]
