import Beta from '@components/Shared/Badges/Beta'
import { Card } from '@components/UI/Card'
import { CheckCircleIcon, ExternalLinkIcon } from '@heroicons/react/outline'
import { Leafwatch } from '@lib/leafwatch'
import axios from 'axios'
import { APP_NAME } from 'data/constants'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from 'src/store/app'
import { SETTINGS } from 'src/tracking'

const REFLECT_URL = 'https://reflect.withlens.app'

const CrossPost: FC = () => {
  const { t } = useTranslation('common')
  const currentProfile = useAppStore((state) => state.currentProfile)
  const [repostingTo, setRepostingTo] = useState<string | null>(null)

  useEffect(() => {
    axios
      .get('https://reflect.withlens.app/api/profile/' + currentProfile?.id)
      .then((response) => {
        if (response.data?.active) {
          setRepostingTo(response.data?.twitter_handle)
        }
      })
      .catch(() => {
        setRepostingTo(null)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Card className="space-y-2 linkify p-5">
      <div className="flex items-center space-x-2">
        <div className="text-lg font-bold">{t('Twitter cross post')}</div>
        <Beta />
      </div>
      <div className="pb-3">
        {APP_NAME} {t('Twitter cross post description')}
      </div>
      {repostingTo ? (
        <>
          <div className="flex items-center space-x-1.5">
            <span>
              Already reposting to <b>@{repostingTo}</b>
            </span>
            <CheckCircleIcon className="w-5 h-5 text-brand" />
          </div>
          <a
            href={REFLECT_URL}
            className="flex items-center space-x-1.5"
            onClick={() => {
              Leafwatch.track(SETTINGS.ACCOUNT.OPEN_REFLECT_DISABLE)
            }}
            target="_blank"
            rel="noreferrer noopener"
          >
            <span>Disable now</span>
            <ExternalLinkIcon className="w-4 h-4" />
          </a>
        </>
      ) : (
        <a
          href={REFLECT_URL}
          className="flex items-center space-x-1.5"
          onClick={() => {
            Leafwatch.track(SETTINGS.ACCOUNT.OPEN_REFLECT_ENABLE)
          }}
          target="_blank"
          rel="noreferrer noopener"
        >
          <span>Setup now</span>
          <ExternalLinkIcon className="w-4 h-4" />
        </a>
      )}
    </Card>
  )
}

export default CrossPost
