/* eslint-disable camelcase */
import copy from 'fast-copy'

import { pickBy } from 'lodash'
import React, { useCallback, useMemo, useState } from 'react'
import { Col, Row } from 'reactstrap'
import perCountryData from 'src/../data/perCountryData.json'

import { Editable } from 'src/components/Common/Editable'

import { DistributionSidebar } from 'src/components/DistributionSidebar/DistributionSidebar'
import { Layout } from 'src/components/Layout/Layout'

import { CountryDistributionPlotCard } from './CountryDistributionPlotCard'
import { CountryDistributionDatum } from './CountryDistributionPlot'

const CLUSTERS = copy(perCountryData.cluster_names).sort()
const CLUSTERS_STATE = CLUSTERS.reduce((result, cluster) => {
  return { ...result, [cluster]: { enabled: true } }
}, {})

const COUNTRIES = perCountryData.distributions.map(({ country }) => country).sort()
const COUNTRIES_STATE = COUNTRIES.reduce((result, country) => {
  return { ...result, [country]: { enabled: true } }
}, {})

export interface ClusterState {
  [key: string]: { enabled: boolean }
}

export interface CountryState {
  [key: string]: { enabled: boolean }
}

export interface CountryDistribution {
  country: string
  distribution: CountryDistributionDatum[]
}

export interface CountryDistributionJson {
  cluster_names: string[]
  distributions: CountryDistribution[]
}

export function filterCountries(countries: CountryState, countryDistrubutions: CountryDistribution[]) {
  const enabledCountries = Object.entries(countries)
    .filter(([_0, { enabled }]) => enabled)
    .map(([country]) => country)

  const withCountriesFiltered = countryDistrubutions.filter(({ country }) => {
    return enabledCountries.some((candidate) => candidate === country)
  })

  return { enabledCountries, withCountriesFiltered }
}

export function filterClusters(clusters: ClusterState, withCountriesFiltered: CountryDistribution[]) {
  const enabledClusters = Object.entries(clusters)
    .filter(([_0, { enabled }]) => enabled)
    .map(([cluster]) => cluster)

  const withClustersFiltered = withCountriesFiltered.map(({ country, distribution }) => {
    const distributionFiltered = distribution.map((dist) => {
      const countsFiltered = pickBy(dist.cluster_counts, (_0, cluster) => {
        return enabledClusters.some((candidate) => candidate === cluster)
      })

      return { ...dist, cluster_counts: countsFiltered }
    })
    return { country, distribution: distributionFiltered }
  })

  return { enabledClusters, withClustersFiltered }
}

const countryDistrubutions: CountryDistribution[] = perCountryData.distributions

export function CountryDistributionPage() {
  const [countries, setCountries] = useState<CountryState>(COUNTRIES_STATE)
  const [clusters, setClusters] = useState<ClusterState>(CLUSTERS_STATE)

  const { withCountriesFiltered } = useMemo(() => filterCountries(countries, countryDistrubutions), [countries])
  const { enabledClusters, withClustersFiltered } =
    /* prettier-ignore */
    useMemo(() => filterClusters(clusters, withCountriesFiltered), [clusters, withCountriesFiltered])

  const countryDistributionComponents = useMemo(
    () =>
      withClustersFiltered.map(({ country, distribution }) => (
        <CountryDistributionPlotCard
          key={country}
          country={country}
          distribution={distribution}
          cluster_names={enabledClusters}
        />
      )),
    [enabledClusters, withClustersFiltered],
  )

  const handleClusterCheckedChange = useCallback(
    (cluster: string) =>
      setClusters((oldClusters) => {
        return { ...oldClusters, [cluster]: { ...oldClusters[cluster], enabled: !oldClusters[cluster].enabled } }
      }),
    [],
  )

  const handleCountryCheckedChange = useCallback(
    (country: string) =>
      setCountries((oldCountries) => {
        return { ...oldCountries, [country]: { ...oldCountries[country], enabled: !oldCountries[country].enabled } }
      }),
    [],
  )

  return (
    <Layout wide>
      <Row noGutters>
        <Col lg={4}>
          <DistributionSidebar
            clusters={clusters}
            countries={countries}
            onClusterFilterChange={handleClusterCheckedChange}
            onCountryFilterChange={handleCountryCheckedChange}
          />
        </Col>

        <Col md={9}>
          <Editable githubUrl={'TODO'} text={'Add or edit this data'}>
            <Row noGutters>
              <Col>{countryDistributionComponents}</Col>
            </Row>
          </Editable>
        </Col>
      </Row>
    </Layout>
  )
}