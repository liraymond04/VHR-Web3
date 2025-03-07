import { Button } from '@components/UI/Button'
import { SwitchHorizontalIcon } from '@heroicons/react/outline'
import { Analytics } from '@lib/analytics'
import type { FC } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { CHAIN_ID } from 'src/constants'
import { SYSTEM } from 'src/tracking'
import { useSwitchNetwork } from 'wagmi'

interface Props {
  className?: string
}

const SwitchNetwork: FC<Props> = ({ className = '' }) => {
  const { t } = useTranslation('common')
  const { switchNetwork } = useSwitchNetwork()

  return (
    <Button
      className={className}
      type="button"
      variant="danger"
      icon={<SwitchHorizontalIcon className="w-4 h-4" />}
      onClick={() => {
        if (switchNetwork) {
          switchNetwork(CHAIN_ID)
        } else {
          toast.error(t('Change wallet'))
        }
        Analytics.track(SYSTEM.SWITCH_NETWORK)
      }}
    >
      {t('Switch network')}
    </Button>
  )
}

export default SwitchNetwork
