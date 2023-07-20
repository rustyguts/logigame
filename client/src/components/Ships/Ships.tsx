import { Ship } from '../../types'
import { getShips } from '../../api/api'
import { useQuery } from '@tanstack/react-query'
import { SocketContext } from '../SocketContext'
import { CircleLayer, Layer, Marker, Source } from 'react-map-gl'
import { useContext, useEffect, useMemo, useState } from 'react'
import { Feature } from 'geojson'
import {
  Box,
  Heading,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from '@chakra-ui/react'
import { FaAnchor } from 'react-icons/fa'
import { GiBoatPropeller } from 'react-icons/gi'

interface Props {
  ship: Ship
}

function ShipLayer(props: Props) {
  const [s, setShip] = useState<Ship>(props.ship)
  const { socket } = useContext(SocketContext)

  const layerStyle: CircleLayer = {
    id: s.id,
    source: s.id,
    type: 'circle',
    paint: {
      'circle-radius': 1,
      'circle-color': '#007cbf',
    },
  }

  useEffect(() => {
    if (socket) {
      socket.on('shipPosition', (data) => {
        // console.debug('Received message:', data)
        if (data.shipId === s.id) {
          // console.debug('Updating ship location')
          setShip({
            ...s,
            position: data.position,
          })
        }
      })
    }
  }, [socket])

  const geojson = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [s.position[1], s.position[0]],
          },
          properties: {
            id: s.id,
            name: s.name,
          },
        },
      ],
    }
  }, [s])

  return (
    <>
      <Source type="geojson" data={geojson}>
        <Layer {...layerStyle} />
        {geojson.features.map((f: Feature) => {
          return (
            <Marker
              key={`ship-${f.properties.id}`}
              latitude={f.geometry.coordinates[1]}
              longitude={f.geometry.coordinates[0]}
            >
              <Popover closeOnBlur={false}>
                <PopoverTrigger>
                  <Box w="auto" h="auto" zIndex={-1}>
                    <GiBoatPropeller
                      cursor="pointer"
                      color="#E8B00F"
                      size="20px"
                      style={{ stroke: 'black', strokeWidth: '2em' }}
                    />
                  </Box>
                </PopoverTrigger>
                <Box zIndex={3000}>
                  <PopoverContent>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader>
                      <Heading size="sm">{f.properties.name}</Heading>
                    </PopoverHeader>
                    <PopoverBody>Ship Details</PopoverBody>
                  </PopoverContent>
                </Box>
              </Popover>
            </Marker>
          )
        })}
      </Source>
    </>
  )
}

export default function ShipLayers() {
  const shipsQuery = useQuery({
    queryKey: ['ships'],
    queryFn: getShips,
  })

  return (
    <>
      {shipsQuery?.data?.map((s) => {
        return <ShipLayer key={s.id} ship={s} />
      })}
    </>
  )
}
