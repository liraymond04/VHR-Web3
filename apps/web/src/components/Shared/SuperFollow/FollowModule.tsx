import AllowanceButton from '@components/Settings/Allowance/Button'
import { Button } from '@components/UI/Button'
import { Spinner } from '@components/UI/Spinner'
import { WarningMessage } from '@components/UI/WarningMessage'
import useBroadcast from '@components/utils/hooks/useBroadcast'
import type { BCharityFollowModule } from '@generated/types'
import { StarIcon, UserIcon } from '@heroicons/react/outline'
import { Analytics } from '@lib/analytics'
import formatAddress from '@lib/formatAddress'
import formatHandle from '@lib/formatHandle'
import getSignature from '@lib/getSignature'
import getTokenImage from '@lib/getTokenImage'
import onError from '@lib/onError'
import splitSignature from '@lib/splitSignature'
import { LensHubProxy } from 'abis'
import { LENSHUB_PROXY, POLYGONSCAN_URL, RELAY_ON, SIGN_WALLET } from 'data/constants'
import type { Profile } from 'lens';
import {
  FollowModules,
  useApprovedModuleAllowanceAmountQuery,
  useCreateFollowTypedDataMutation,
  useSuperFollowQuery
} from 'lens'
import type { Dispatch, FC } from 'react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useAppStore } from 'src/store/app'
import { PROFILE } from 'src/tracking'
import { useAccount, useBalance, useContractWrite, useSignTypedData } from 'wagmi'

import Loader from '../Loader'
import Slug from '../Slug'
import Uniswap from '../Uniswap'

interface Props {
  profile: Profile
  setFollowing: Dispatch<boolean>
  setShowFollowModal: Dispatch<boolean>
  again: boolean
}

const FollowModule: FC<Props> = ({ profile, setFollowing, setShowFollowModal, again }) => {
  const { t } = useTranslation('common')
  const userSigNonce = useAppStore((state) => state.userSigNonce)
  const setUserSigNonce = useAppStore((state) => state.setUserSigNonce)
  const currentProfile = useAppStore((state) => state.currentProfile)
  const [allowed, setAllowed] = useState(true)
  const { address } = useAccount()
  const { isLoading: signLoading, signTypedDataAsync } = useSignTypedData({ onError })

  const onCompleted = () => {
    setFollowing(true)
    setShowFollowModal(false)
    toast.success('Followed successfully!')
    Analytics.track(PROFILE.SUPER_FOLLOW)
  }

  const { isLoading: writeLoading, write } = useContractWrite({
    address: LENSHUB_PROXY,
    abi: LensHubProxy,
    functionName: 'followWithSig',
    mode: 'recklesslyUnprepared',
    onSuccess: onCompleted,
    onError
  })

  const { data, loading } = useSuperFollowQuery({
    variables: { request: { profileId: profile?.id } },
    skip: !profile?.id
  })

  const followModule: any = data?.profile?.followModule

  const { data: allowanceData, loading: allowanceLoading } = useApprovedModuleAllowanceAmountQuery({
    variables: {
      request: {
        currencies: followModule?.amount?.asset?.address,
        followModules: [FollowModules.FeeFollowModule],
        collectModules: [],
        referenceModules: []
      }
    },
    skip: !followModule?.amount?.asset?.address || !currentProfile,
    onCompleted: (data) => {
      setAllowed(data?.approvedModuleAllowanceAmount[0]?.allowance !== '0x00')
    }
  })

  const { data: balanceData } = useBalance({
    address: currentProfile?.ownedBy,
    token: followModule?.amount?.asset?.address,
    formatUnits: followModule?.amount?.asset?.decimals,
    watch: true
  })
  let hasAmount = false

  if (balanceData && parseFloat(balanceData?.formatted) < parseFloat(followModule?.amount?.value)) {
    hasAmount = false
  } else {
    hasAmount = true
  }

  const { broadcast, loading: broadcastLoading } = useBroadcast({ onCompleted })
  const [createFollowTypedData, { loading: typedDataLoading }] = useCreateFollowTypedDataMutation({
    onCompleted: async ({ createFollowTypedData }) => {
      try {
        const { id, typedData } = createFollowTypedData
        const { profileIds, datas: followData, deadline } = typedData.value
        const signature = await signTypedDataAsync(getSignature(typedData))
        const { v, r, s } = splitSignature(signature)
        const sig = { v, r, s, deadline }
        const inputStruct = {
          follower: address,
          profileIds,
          datas: followData,
          sig
        }

        setUserSigNonce(userSigNonce + 1)
        if (!RELAY_ON) {
          return write?.({ recklesslySetUnpreparedArgs: [inputStruct] })
        }

        const {
          data: { broadcast: result }
        } = await broadcast({ request: { id, signature } })

        if ('reason' in result) {
          write?.({ recklesslySetUnpreparedArgs: [inputStruct] });
        }
      } catch {}
    },
    onError
  })

  const createFollow = () => {
    if (!currentProfile) {
      return toast.error(SIGN_WALLET)
    }

    createFollowTypedData({
      variables: {
        options: { overrideSigNonce: userSigNonce },
        request: {
          follow: [
            {
              profile: profile?.id,
              followModule: {
                feeFollowModule: {
                  amount: {
                    currency: followModule?.amount?.asset?.address,
                    value: followModule?.amount?.value
                  }
                }
              }
            }
          ]
        }
      }
    })
  }          

  if (loading) {
    return <Loader message="Loading super follow" />
  }

  return (
    <div className="p-5">
      <div className="pb-2 space-y-1.5">
        <div className="text-lg font-bold">
          Super follow <Slug slug={formatHandle(profile?.handle)} prefix="@" /> {again ? 'again' : ''}
        </div>
        <div className="text-gray-500">
          Follow {again ? 'again' : ''} {t('Get perks')}
        </div>
      </div>
      <div className="flex items-center py-2 space-x-1.5">
        <img
          className="w-7 h-7"
          height={28}
          width={28}
          src={getTokenImage(followModule?.amount?.asset?.symbol)}
          alt={followModule?.amount?.asset?.symbol}
          title={followModule?.amount?.asset?.name}
        />
        <span className="space-x-1">
          <span className="text-2xl font-bold">{followModule?.amount?.value}</span>
          <span className="text-xs">{followModule?.amount?.asset?.symbol}</span>
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <UserIcon className="w-4 h-4 text-gray-500" />
        <div className="space-x-1.5">
          <span>{t('Recipient 1')}</span>
          <a
            href={`${POLYGONSCAN_URL}/address/${followModule?.recipient}`}
            target="_blank"
            className="font-bold text-gray-600"
            rel="noreferrer noopener"
          >
            {formatAddress(followModule?.recipient)}
          </a>
        </div>
      </div>
      <div className="pt-5 space-y-2">
        <div className="text-lg font-bold">{t('Perks')}</div>
        <ul className="space-y-1 text-sm text-gray-500">
          <li className="flex space-x-2 tracking-normal leading-6">
            <div>•</div>
            <div>
              {t('You can comment on')} {formatHandle(profile?.handle)}&rsquo;
              {t('s publications')}
            </div>
          </li>
          <li className="flex space-x-2 tracking-normal leading-6">
            <div>•</div>
            <div>
              {t('You can collect')} {formatHandle(profile?.handle)}&rsquo;
              {t('s publications')}
            </div>
          </li>
          <li className="flex space-x-2 tracking-normal leading-6">
            <div>•</div>
            <div>
              {t('Super follow badge')}
              {formatHandle(profile?.handle)}&rsquo;{t('s profile')}
            </div>
          </li>
          <li className="flex space-x-2 tracking-normal leading-6">
            <div>•</div>
            <div>{t('High voting power')}</div>
          </li>
          <li className="flex space-x-2 tracking-normal leading-6">
            <div>•</div>
            <div>{t('More coming')}</div>
          </li>
        </ul>
      </div>
      {currentProfile ? (
        allowanceLoading ? (
          <div className="mt-5 w-28 rounded-lg h-[34px] shimmer" />
        ) : allowed ? (
          hasAmount ? (
            <Button
              className="text-sm !px-3 !py-1.5 mt-5"
              variant="super"
              outline
              onClick={createFollow}
              disabled={typedDataLoading || signLoading || writeLoading || broadcastLoading}
              icon={
                typedDataLoading || signLoading || writeLoading || broadcastLoading ? (
                  <Spinner variant="super" size="xs" />
                ) : (
                  <StarIcon className="w-4 h-4" />
                )
              }
            >
              {t('Super follow')} {again ? 'again' : 'now'}
            </Button>
          ) : (
            <WarningMessage
              className="mt-5"
              message={<Uniswap module={followModule as BCharityFollowModule} />}
            />
          )
        ) : (
          <div className="mt-5">
            <AllowanceButton
              title={t('Allow follow module')}
              module={allowanceData?.approvedModuleAllowanceAmount[0]}
              allowed={allowed}
              setAllowed={setAllowed}
            />
          </div>
        )
      ) : null}
    </div>
  )
}

export default FollowModule
