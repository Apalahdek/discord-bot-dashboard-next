import {
  Center,
  Circle,
  Flex,
  Grid,
  Heading,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Icon,
  useToast,
  Box,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { config } from '@/config/common';
import { StyledChart } from '@/components/chart/StyledChart';
import { dashboard } from '@/config/translations/dashboard';
import Link from 'next/link';
import { BsMusicNoteBeamed } from 'react-icons/bs';
import { IoOpen, IoPricetag } from 'react-icons/io5';
import { FaRobot } from 'react-icons/fa';
import { MdVoiceChat } from 'react-icons/md';
import { GuildSelect } from '@/pages/user/home';

export default function HomeView() {
  const t = dashboard.useTranslations();
  const [apiKey, setApiKey] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('jkt48-api-key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      checkApiKey(storedApiKey);
    }
  }, []);

  const checkApiKey = async (key: string) => {
    try {
      const response = await fetch(`https://api.jkt48connect.my.id/api/check-apikey/${key}`);
      const data = await response.json();

      if (data.success) {
        setExpiryDate(data.expiry_date);
        setRemainingRequests(data.remaining_requests);
      }
    } catch (error) {
      console.error('Error checking API key:', error);
    }
  };

  return (
    <Flex direction="column" gap={5}>
      {/* Section Invite */}
      <Flex direction="row" alignItems="center" rounded="2xl" bg="Brand" gap={4} p={5}>
        <Circle
          color="white"
          bgGradient="linear(to right bottom, transparent, blackAlpha.600)"
          p={4}
          shadow="2xl"
          display={{ base: 'none', md: 'block' }}
        >
          <Icon as={FaRobot} w="60px" h="60px" />
        </Circle>

        <Flex direction="column" align="start" gap={1} w="full">
          <Heading color="white" fontSize="2xl" fontWeight="bold">
            {t.invite.title}
          </Heading>

          <Grid templateColumns="repeat(3, 1fr)" gap={4} w="full" mt={3}>
            {/* Card untuk Nama API Key */}
            <Card rounded="xl" variant="primary">
              <CardBody>
                <Text fontWeight="bold" color="whiteAlpha.900">
                  API Key Name
                </Text>
                <Text color="whiteAlpha.700">
                  {apiKey ? 'JKT48 User API' : 'API Key not available'}
                </Text>
              </CardBody>
            </Card>

            {/* Card untuk Expiry Date */}
            <Card rounded="xl" variant="primary">
              <CardBody>
                <Text fontWeight="bold" color="whiteAlpha.900">
                  Expiry Date
                </Text>
                <Text color="whiteAlpha.700">
                  {expiryDate ? expiryDate : 'Unknown'}
                </Text>
              </CardBody>
            </Card>

            {/* Card untuk Remaining Requests */}
            <Card rounded="xl" variant="primary">
              <CardBody>
                <Text fontWeight="bold" color="whiteAlpha.900">
                  Remaining Requests
                </Text>
                <Text color="whiteAlpha.700">
                  {remainingRequests !== null ? remainingRequests : 'Unknown'}
                </Text>
              </CardBody>
            </Card>
          </Grid>
        </Flex>
      </Flex>

      {/* Section Servers */}
      <Flex direction="column" gap={1} mt={3}>
        <Heading size="md">{t.servers.title}</Heading>
        <Text color="TextSecondary">{t.servers.description}</Text>
      </Flex>
      <GuildSelect />

      {/* Section Commands */}
      <Flex direction="column" gap={1}>
        <Heading size="md">{t.command.title}</Heading>
        <Text color="TextSecondary">{t.command.description}</Text>
        <HStack mt={3}>
          <Button leftIcon={<IoPricetag />} variant="action">
            {t.pricing}
          </Button>
          <Button px={6} rounded="xl" variant="secondary">
            {t.learn_more}
          </Button>
        </HStack>
      </Flex>
      <TestChart />
      <Grid templateColumns={{ base: '1fr', lg: '0.5fr 1fr' }} gap={3}>
        <Card rounded="3xl" variant="primary">
          <CardBody as={Center} p={4} flexDirection="column" gap={3}>
            <Circle p={4} bg="brandAlpha.100" color="brand.500" _dark={{ color: 'brand.200' }}>
              <Icon as={BsMusicNoteBeamed} w="80px" h="80px" />
            </Circle>
            <Text fontWeight="medium">{t.vc.create}</Text>
          </CardBody>
        </Card>
        <Flex direction="column" gap={3}>
          <Text fontSize="lg" fontWeight="600">
            JKT48Connect Section
          </Text>
          <VoiceChannelItem />
        </Flex>
      </Grid>
    </Flex>
  );
}

function TestChart() {
  const [seriesData, setSeriesData] = useState([
    {
      name: 'Paid',
      data: [50, 64, 48, 66, 49, 68],
    },
    {
      name: 'Free Usage',
      data: [30, 50, 13, 46, 26, 16],
    },
  ]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSeriesData((prevData) => {
        const newPaidData = [...prevData[0].data];
        const newFreeUsageData = [...prevData[1].data];

        newPaidData.push(newPaidData[newPaidData.length - 1] + Math.floor(Math.random() * 5));
        newFreeUsageData.push(newFreeUsageData[newFreeUsageData.length - 1] + Math.floor(Math.random() * 5));

        if (newPaidData.length > 6) newPaidData.shift();
        if (newFreeUsageData.length > 6) newFreeUsageData.shift();

        return [
          { name: 'Paid', data: newPaidData },
          { name: 'Free Usage', data: newFreeUsageData },
        ];
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <StyledChart
      options={{
        colors: ['#4318FF', '#39B8FF'],
        chart: {
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
            animateGradually: {
              enabled: true,
              delay: 150,
            },
          },
        },
        xaxis: {
          categories: ['SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB'],
        },
        legend: {
          position: 'right',
        },
        responsive: [
          {
            breakpoint: 650,
            options: {
              legend: {
                position: 'bottom',
              },
            },
          },
        ],
      }}
      series={seriesData}
      height="300"
      type="line"
    />
  );
}

function VoiceChannelItem() {
  return (
    <Card rounded="2xl" variant="primary">
      <CardHeader as={HStack}>
        <Icon as={MdVoiceChat} color="Brand" fontSize={{ base: '2xl', md: '3xl' }} />
        <Text>Your Apikey Details</Text>
      </CardHeader>
      <CardBody mt={3}>
        <Text color="TextSecondary">Masukkan API Key di profile untuk menggunakan fitur ini.</Text>
      </CardBody>
    </Card>
  );
}
