import ChatIconSVG from 'static/img/ChatIcon.svg'
import ActivityIconSVG from 'static/svg/Narrator/Activity.svg'
import CustomerJourneyIconSVG from 'static/svg/Narrator/CustomerJourney.svg'
import DatasetIconSVG from 'static/svg/Narrator/Dataset.svg'
import DocsIconSVG from 'static/svg/Narrator/Docs.svg'
import NarrativeIconSVG from 'static/svg/Narrator/Narrative.svg'
import ProcessingIconSVG from 'static/svg/Narrator/Processing.svg'
import TransformationIconSVG from 'static/svg/Narrator/Transformation.svg'

type NavIconProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>

export const ChatIcon = (props: NavIconProps) => (
  <span role="img" className="anticon anticon-chat" {...props}>
    <ChatIconSVG />
  </span>
)

export const DatasetIcon = (props: NavIconProps) => (
  <span role="img" className="anticon anticon-dataset" {...props}>
    <DatasetIconSVG />
  </span>
)

export const NarrativeIcon = (props: NavIconProps) => (
  <span role="img" className="anticon anticon-narrative" {...props}>
    <NarrativeIconSVG />
  </span>
)

export const ActivityIcon = (props: NavIconProps) => (
  <span role="img" className="anticon anticon-activity" {...props}>
    <ActivityIconSVG />
  </span>
)

export const TransformationIcon = (props: NavIconProps) => (
  <span role="img" className="anticon anticon-transformation" {...props}>
    <TransformationIconSVG />
  </span>
)
export const ProcessingIcon = (props: NavIconProps) => (
  <span role="img" className="anticon anticon-processing" {...props}>
    <ProcessingIconSVG />
  </span>
)

export const CustomerJourneyIcon = (props: NavIconProps) => (
  <span role="img" className="anticon anticon-customer-journey" {...props}>
    <CustomerJourneyIconSVG />
  </span>
)

export const DocsIcon = (props: NavIconProps) => (
  <span role="img" className="anticon anticon-docs" {...props}>
    <DocsIconSVG />
  </span>
)
