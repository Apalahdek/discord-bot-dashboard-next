import { useState, useEffect } from 'react';
import { Flex, Grid, Spacer, Text, VStack, Box } from '@chakra-ui/layout';
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Image,
  useColorMode,
  Input,
  useToast,
} from '@chakra-ui/react';
import { IoLogOut } from 'react-icons/io5';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useLogoutMutation } from '@/utils/auth/hooks';
import { useSelfUser } from '@/api/hooks';
import { profile } from '@/config/translations/profile';
import { avatarUrl, bannerUrl } from '@/api/discord';
import { SelectField } from '@/components/forms/SelectField';
import { SwitchField } from '@/components/forms/SwitchField';
import { languages, useLang } from '@/config/translations/provider';
import { useSettingsStore } from '@/stores';
import AppLayout from '@/components/layout/app';
import { NextPageWithLayout } from '@/pages/_app';
import { auth } from '@/config/firebaseConfig'; // Firebase config

const names = {
  en: "English",
  fr: "French",
  cn: "Chindo Rek",
  // Add other language names here
};

/**
 * User info and general settings here
 */
const ProfilePage: NextPageWithLayout = () => {
  const user = useSelfUser();
  const logout = useLogoutMutation();
  const t = profile.useTranslations();

  const { colorMode, setColorMode } = useColorMode();
  const { lang, setLang } = useLang();
  const [devMode, setDevMode] = useSettingsStore((s) => [s.devMode, s.setDevMode]);
  const [apiKey, setApiKey] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const [linkedGmail, setLinkedGmail] = useState<boolean>(false);
  const [linkedEmail, setLinkedEmail] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    // Check if the user has linked their Gmail account
    const storedEmail = localStorage.getItem('linked-gmail-email');
    if (storedEmail) {
      setLinkedGmail(true);
      setLinkedEmail(storedEmail);
    }

    const storedApiKey = localStorage.getItem('jkt48-api-key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const saveApiKey = () => {
    if (!apiKey) {
      toast({
        title: 'Error',
        description: 'API Key tidak boleh kosong!',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    localStorage.setItem('jkt48-api-key', apiKey);
    setApiStatus('API Key berhasil disimpan');
    toast({
      title: 'Success',
      description: 'API Key berhasil disimpan!',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const linkGmailAccount = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Trigger the Google sign-in popup
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Store the Gmail email in localStorage and set linked status
      localStorage.setItem('linked-gmail', 'true');
      localStorage.setItem('linked-gmail-email', user.email || 'Unknown Email');
      setLinkedGmail(true);
      setLinkedEmail(user.email || 'Unknown Email');

      toast({
        title: 'Gmail Linked',
        description: `Your Gmail account (${user.email}) has been successfully linked.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Optionally, store user's Gmail in the user database on the server
      await fetch('/api/auth/linkGmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });
    } catch (error) {
      console.error('Error linking Gmail:', error);
      toast({
        title: 'Error',
        description: 'Failed to link Gmail account.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Grid templateColumns={{ base: '1fr', lg: 'minmax(0, 800px) auto' }} gap={{ base: 3, lg: 6 }}>
      <Flex direction="column">
        {user.banner != null ? (
          <Image
            alt="banner"
            src={bannerUrl(user.id, user.banner)}
            sx={{ aspectRatio: '1100 / 440' }}
            objectFit="cover"
            rounded="2xl"
          />
        ) : (
          <Box bg="Brand" rounded="2xl" sx={{ aspectRatio: '1100 / 440' }} />
        )}
        <VStack mt="-50px" ml="40px" align="start">
          <Avatar
            src={avatarUrl(user)}
            name={user.username}
            w="100px"
            h="100px"
            ringColor="CardBackground"
            ring="6px"
          />
          <Text fontWeight="600" fontSize="2xl">
            {user.username}
          </Text>
        </VStack>
      </Flex>
      <Card w="full" rounded="3xl" h="fit-content" variant="primary">
        <CardHeader fontSize="2xl" fontWeight="600">
          {t.settings}
        </CardHeader>
        <CardBody as={Flex} direction="column" gap={6} mt={3}>
          <SwitchField
            id="dark-mode"
            label={t['dark mode']}
            desc={t['dark mode description']}
            isChecked={colorMode === 'dark'}
            onChange={(e) => setColorMode(e.target.checked ? 'dark' : 'light')}
          />
          <SwitchField
            id="developer-mode"
            label={t['dev mode']}
            desc={t['dev mode description']}
            isChecked={devMode}
            onChange={(e) => setDevMode(e.target.checked)}
          />
          <FormControl>
            <Box mb={2}>
              <FormLabel fontSize="md" fontWeight="medium" m={0}>
                {t.language}
              </FormLabel>
              <Text color="TextSecondary">{t['language description']}</Text>
            </Box>
            <SelectField
              value={{
                label: names[lang],
                value: lang,
              }}
              onChange={(e) => e != null && setLang(e.value)}
              options={languages.map((lang) => ({
                label: lang.name,
                value: lang.key,
              }))}
            />
          </FormControl>

          {/* Gmail Settings */}
          <FormControl>
            <Box mb={2}>
              <FormLabel fontSize="md" fontWeight="medium" m={0}>
                Linked Gmail Account
              </FormLabel>
              {linkedGmail && linkedEmail ? (
                <Text color="green.500">
                  Linked Email: {linkedEmail}
                </Text>
              ) : (
                <Text color="red.500">No Gmail account linked.</Text>
              )}
            </Box>
            <Button
              colorScheme="blue"
              onClick={linkGmailAccount}
            >
              {linkedGmail ? 'Link Another Gmail Account' : 'Link Gmail Account'}
            </Button>
          </FormControl>

          <Spacer />
          <Button
            leftIcon={<IoLogOut />}
            variant="danger"
            isLoading={logout.isLoading}
            onClick={() => logout.mutate()}
          >
            {t.logout}
          </Button>
        </CardBody>
      </Card>
    </Grid>
  );
};

ProfilePage.getLayout = (p) => <AppLayout>{p}</AppLayout>;

export default ProfilePage;
