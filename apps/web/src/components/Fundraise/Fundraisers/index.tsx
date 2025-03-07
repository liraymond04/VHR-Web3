import { gql, useQuery } from '@apollo/client'
import MetaTags from '@components/Common/MetaTags'
import Like from '@components/Publication/Actions/Like'
import Share from '@components/Publication/Actions/Share'
import Markup from '@components/Shared/Markup'
import { Button } from '@components/UI/Button'
import { Card } from '@components/UI/Card'
import { GridItemFour, GridLayout } from '@components/UI/GridLayout'
import { Spinner } from '@components/UI/Spinner'
import { Tooltip } from '@components/UI/Tooltip'
import type { BCharityPublication } from '@generated/types'
import { CommentFields } from 'lens/documents/CommentFields'
import { MirrorFields } from 'lens/documents/MirrorFields'
import { PostFields } from 'lens/documents/PostFields'
import getTokenImage from '@lib/getTokenImage'
import imageProxy from '@lib/imageProxy'
import Logger from '@lib/logger'
import { APP_NAME, STATIC_IMAGES_URL } from 'data/constants'
import { PaginatedResultInfo } from 'lens'
import type { FC } from 'react'
import { useState } from 'react'
import { useInView } from 'react-cool-inview'
import { useTranslation } from 'react-i18next'
import { useAppStore } from 'src/store/app'

import RevenueDetails from './PublicationRevenue'

const EXPLORE_FEED_QUERY = gql`
  query ExploreFeed(
    $request: ExplorePublicationRequest!
    $reactionRequest: ReactionFieldResolverRequest
    $profileId: ProfileId
  ) {
    explorePublications(request: $request) {
      items {
        ... on Post {
          ...PostFields
        }
        ... on Comment {
          ...CommentFields
        }
        ... on Mirror {
          ...MirrorFields
        }
      }
      pageInfo {
        totalCount
        next
      }
    }
  }
  ${PostFields}
  ${CommentFields}
  ${MirrorFields}
`

interface Props {
  publication: BCharityPublication
  isFullPublication?: boolean
}

const Fundraisers: FC<Props> = ({ publication, isFullPublication = false }) => {
  const { t } = useTranslation('common')
  const feedType = 'LATEST'
  const [pageInfo, setPageInfo] = useState<PaginatedResultInfo>()
  const [publications, setPublications] = useState<BCharityPublication[]>([])
  const [revenueData, setRevenueData] = useState<number[]>([])
  const currentProfile = useAppStore((state) => state.currentProfile)

  const { data, loading, error, fetchMore } = useQuery(EXPLORE_FEED_QUERY, {
    variables: {
      request: {
        sortCriteria: feedType,
        limit: 50,
        noRandomize: feedType === 'LATEST',
        metadata: {
          tags: {
            oneOf: 'bcharity-fundraise'
          }
        }
      },
      reactionRequest: currentProfile ? { profileId: currentProfile?.id } : null,
      profileId: currentProfile?.id ?? null
    },
    onCompleted: (data) => {
      const fundraise = data?.explorePublications?.items

      setPageInfo(data?.explorePublications?.pageInfo)
      setPublications(fundraise)

      setRevenueData([...revenueData])
      Logger.log('[Query]', `Fetched first 50 explore publications FeedType:${feedType}`)
    }
  })
  console.log(revenueData)

  const { observe } = useInView({
    onEnter: async () => {
      const { data } = await fetchMore({
        variables: {
          request: {
            sortCriteria: feedType,
            cursor: pageInfo?.next,
            limit: 50,
            noRandomize: feedType === 'LATEST'
          },
          reactionRequest: currentProfile ? { profileId: currentProfile?.id } : null,
          profileId: currentProfile?.id ?? null
        }
      })
      const fundraise = data?.explorePublications?.items.filter((i: any) => {
        return i?.metadata?.attributes[0]?.value == 'fundraise'
      })
      // console.log('publication', publications.length)
      const nextValues = data?.explorePublications?.items
      let count = 0
      // console.log('next 15', nextValues)
      nextValues.forEach((i: any) => {
        if (i?.metadata?.attributes[0]?.value == 'fundraise') {
          count++
        }
      })

      console.log('page info', pageInfo?.next)
      console.log('explore publications', data?.explorePublications?.pageInfo?.next)
      setPageInfo(data?.explorePublications?.pageInfo)
      setPublications([...publications, ...fundraise])
      console.log('count', count)
      Logger.log(
        '[Query]',
        `Fetched next 50 explore publications FeedType:${feedType} Next:${pageInfo?.next}`
      )
    }
  })

  var cover

  return (
    <GridLayout>
      <MetaTags title={`Fundraisers • ${APP_NAME}`} />
      {publications?.map(
        (publication: BCharityPublication, index: number) => (
          (cover = publication?.metadata?.cover?.original?.url),
          (
            <GridItemFour key={`${publication?.id}_${index}`}>
              <Card>
                {/* <SinglePublication post={post} /> */}

                <div
                  className="h-40 rounded-t-xl border-b sm:h-52 dark:border-b-gray-700/80"
                  style={{
                    backgroundImage: `url(${
                      cover ? imageProxy(cover, 'attachment') : `${STATIC_IMAGES_URL}/patterns/2.svg`
                    })`,
                    backgroundColor: '#8b5cf6',
                    backgroundSize: cover ? 'cover' : '30%',
                    backgroundPosition: 'center center',
                    backgroundRepeat: cover ? 'no-repeat' : 'repeat'
                  }}
                />

                <div className="p-5">
                  <div className="block justify-between items-center sm:flex">
                    <div className="mr-0 space-y-1 sm:mr-16">
                      <div className="text-xl font-bold">{publication?.metadata?.name}</div>
                      <div className="text-sm leading-7 whitespace-pre-wrap break-words">
                        <Markup>
                          {publication?.metadata?.description?.replace(/\n\s*\n/g, '\n\n').trim()}
                        </Markup>
                      </div>
                      <div
                        className="block sm:flex items-center !my-3 space-y-2 sm:space-y-0 sm:space-x-3"
                        data-test="fundraise-meta"
                      />
                    </div>
                  </div>
                  <GridLayout className="!p-0 mt-5">
                    <GridItemFour className="!mb-4 space-y-1 sm:mb-0">
                      {loading ? (
                        <div className="w-16 h-5 !mt-2 rounded-md shimmer" />
                      ) : (
                        <span className="flex items-center space-x-1.5">
                          <Tooltip content={'WMATIC'}>
                            <img
                              className="w-7 h-7"
                              height={28}
                              width={28}
                              src={getTokenImage('WMATIC')}
                              alt={'WMATIC'}
                            />
                          </Tooltip>
                          <span className="space-x-1">
                            <RevenueDetails
                              fund={publication}
                              callback={(revenue: any) => {
                                revenueData[index] = revenue
                                if (!revenueData[index]) {
                                  revenueData[index] = 0
                                }
                                setRevenueData([...revenueData])
                              }}
                            />
                            <span className="text-2xl font-bold">{revenueData[index]}</span>
                            <span className="text-xs">{'Raised'}</span>
                          </span>
                        </span>
                      )}
                      <Like publication={publication} isFullPublication={isFullPublication} />
                      <Share publication={publication} />

                      <a
                        href={`/posts/${publication?.id}`}
                        key={publication?.id}
                        style={{ textDecoration: 'none' }}
                      >
                        <Button>Donate</Button>
                      </a>
                    </GridItemFour>
                  </GridLayout>
                </div>
              </Card>
            </GridItemFour>
          )
        )
      )}
      {pageInfo?.next && publications.length !== pageInfo?.totalCount && (
        <span ref={observe} className="flex justify-center p-5">
          <Spinner size="sm" />
        </span>
      )}
    </GridLayout>
  )
}

export default Fundraisers
