import React from 'react'

type IconProps = React.SVGProps<SVGSVGElement> & { className?: string }

export const IconCopy = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width={props.width || 16} height={props.height || 16} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor" />
  </svg>
)

export const IconInfo = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width={props.width || 16} height={props.height || 16} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" d="M7.5 11.508 7.468 8H6.25V7h2.401l.03 3.508H9.8v1H7.5Zm-.25-6.202a.83.83 0 0 1 .207-.577c.137-.153.334-.229.59-.229.256 0 .454.076.594.23.14.152.209.345.209.576 0 .228-.07.417-.21.568-.14.15-.337.226-.593.226-.256 0-.453-.075-.59-.226a.81.81 0 0 1-.207-.568ZM8 13A5 5 0 1 0 8 3a5 5 0 0 0 0 10Zm0 1A6 6 0 1 1 8 2a6 6 0 0 1 0 12Z" fill="currentColor" />
  </svg>
)

export const IconPlus = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width={props.width || 20} height={props.height || 20} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconSettings = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width={props.width || 18} height={props.height || 18} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
    <path stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
)

export const IconClose = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width={props.width || 20} height={props.height || 20} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M6 18 18 6M6 6l12 12" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconChevron = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width={props.width || 14} height={props.height || 14} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fill="currentColor" d="M5.157 13.069l4.611-4.685a.546.546 0 0 0 0-.768L5.158 2.93a.552.552 0 0 1 0-.771.53.53 0 0 1 .759 0l4.61 4.684c.631.641.63 1.672 0 2.312l-4.61 4.684a.53.53 0 0 1-.76 0 .552.552 0 0 1 0-.771z"/>
  </svg>
)

export const IconSearch = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width={props.width || 16} height={props.height || 16} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth={1.5} fill="none" />
  </svg>
)

export const IconRefresh = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width={props.width || 16} height={props.height || 16} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M20 11a8 8 0 10-2.29 5.29L20 20v-5h-5l2.29 2.29A6 6 0 1118 11" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
)

export const IconHistory = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width={props.width || 20} height={props.height || 20} fill="none" xmlns="http://www.w3.org/2000/svg" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
  </svg>
)

export default {
  IconCopy,
  IconInfo,
  IconPlus,
  IconSettings,
  IconClose,
  IconChevron,
  IconHistory,
}
