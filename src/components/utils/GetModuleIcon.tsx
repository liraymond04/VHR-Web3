import { CollectModules, ReferenceModules } from '@generated/types'
import {
  CashIcon,
  ClockIcon,
  DocumentAddIcon,
  PlusCircleIcon,
  ReceiptRefundIcon,
  ShareIcon,
  StopIcon
} from '@heroicons/react/outline'
import React, { FC } from 'react'

interface Props {
  module: string
  size: number
}

const GetModuleIcon: FC<Props> = ({ module, size }) => {
  switch (module) {
    case CollectModules.FeeCollectModule:
      return <CashIcon className={`h-${size}`} />
    case 'LimitedFeeCollectModule':
      return (
        <div className="flex gap-1 items-center">
          <StopIcon className={`h-${size}`} />
          <CashIcon className={`h-${size}`} />
        </div>
      )
    case CollectModules.LimitedTimedFeeCollectModule:
      return (
        <div className="flex gap-1 items-center">
          <StopIcon className={`h-${size}`} />
          <ClockIcon className={`h-${size}`} />
          <CashIcon className={`h-${size}`} />
        </div>
      )
    case CollectModules.TimedFeeCollectModule:
      return (
        <div className="flex gap-1 items-center">
          <ClockIcon className={`h-${size}`} />
          <CashIcon className={`h-${size}`} />
        </div>
      )
    case CollectModules.RevertCollectModule:
      return <ReceiptRefundIcon className={`h-${size}`} />
    case 'FreeCollectModule':
      return <DocumentAddIcon className={`h-${size}`} />
    case 'FeeFollowModule':
      return (
        <div className="flex gap-1 items-center">
          <CashIcon className={`h-${size}`} />
          <PlusCircleIcon className={`h-${size}`} />
        </div>
      )
    case ReferenceModules.FollowerOnlyReferenceModule:
      return (
        <div className="flex gap-1 items-center">
          <PlusCircleIcon className={`h-${size}`} />
          <ShareIcon className={`h-${size}`} />
        </div>
      )
    default:
      return <CashIcon className={`h-${size}`} />
  }
}

export default GetModuleIcon
