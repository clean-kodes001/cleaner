import React, {useState, useEffect, useMemo, useCallback, useRef} from 'react';

import {useDispatch, useSelector} from 'react-redux';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  FlatList,
  Platform,
  InteractionManager,
  Keyboard,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import Text from '../../../components/Shared/Text';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import {useSafeAreaInsets, SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Pusher from 'pusher-js/react-native';
import Echo from 'laravel-echo';
import pusherConfig from '../../../../pusher.json';
import MyChat from '../../../components/chat/MyChat';
import ChatBtm from '../../../components/chat/ChatBtm';
import OthersChat from '../../../components/chat/OthersChat';

import timeformatter from '../../../utils/timeformatter';

import ChatScreenHead from '../../../components/chat/ChatScreenHead';
import Head from '../../../components/Shared/Head';
import {getChat} from '../../../store/actions/chats/getChats';
import {clearRoom} from '../../../store/reducer/chatSlice';
import {getClean} from '../../../store/actions/dashboard/getClean';
import {
  setMessageCount,
  logOut,
  incrementMessageCount,
} from '../../../store/reducer/userSlice';
import {useTranslation} from 'react-i18next';

const ChatRoom = ({navigation, route}) => {
  const {t} = useTranslation();
  if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const cleanData = useSelector(state => state.user.clean);
  const cleanRequest = useSelector(state => state.user.cleanRequest);

  const [_chats, _setChats] = useState([]);
  const [typingUser, setTypingUser] = useState('');
  const typingTimerRef = useRef(null);

  const {chats} = useSelector(state => state.chat);
  const {user} = useSelector(state => state.user);
  const flatListRef = useRef();

  useEffect(() => {
    // Check either cleanData or cleanRequest, whichever is the source of truth for ID
    const currentCleanId = cleanData?.id || cleanRequest?.id;

    if (!currentCleanId) {
      // Use InteractionManager to wait for cleanup effects to complete
      // This prevents 'Cannot remove child' errors during navigation
      const handle = InteractionManager.runAfterInteractions(() => {
        navigation.navigate('Home');
      });
      return () => handle.cancel();
    }
  }, [cleanData?.id, cleanRequest?.id, navigation]);

  useEffect(() => {
    dispatch(getChat());
    // Sync messageCount when chat room opens
    dispatch(getClean());
    dispatch(setMessageCount(0));

    // console.log('CCC', _chats);
    return () => dispatch(clearRoom());
  }, [dispatch]);

  // Scroll to bottom when keyboard shows (especially for Android)
  useEffect(() => {
    const keyboardShowEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardShowListener = Keyboard.addListener(keyboardShowEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      // Increased timeout to ensure keyboard is fully visible before scrolling
      setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}), 300);
    });

    return () => {
      keyboardShowListener.remove();
    };
  }, []);

  useEffect(() => {
    if (chats) {
      const adaptedChats = chats.map(chat => {
        return {
          message: chat.message,
          // Backend message type (text | image); local `type` below is ownership.
          messageType: chat.type || 'text',
          type:
            user.id === chat.sender_id
              ? 'mine'
              : !chat.sender
              ? 'notification'
              : 'others',
          time: chat.created_at,
          first_name: chat?.sender?.name,
          status: 'sent',
          avatar: chat?.receiver?.avatar,
        };
      });
      _setChats(adaptedChats);
    }
  }, [chats, user.id]);

  const pushMyChat = (message, time, messageType = 'text') => {
    const formattedTime = timeformatter(time, 'time_only');
    _setChats(prev => [
      ...prev,
      {
        type: 'mine',
        messageType,
        message,
        time: time,
      },
    ]);
    // Scroll to bottom after sending message
    setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}), 100);
  };

  const incomingMessage = useCallback(
    (message, sender) => {
      console.log('ChatRoom: incomingMessage called', {
        senderId: sender?.id,
        currentUserId: user?.id,
        isFocused,
        hasMessage: !!message,
      });

      if (user.id === sender.id) {
        // Message from current user, don't do anything
        console.log('ChatRoom: Message from current user, ignoring');
      } else {
        // Message from someone else
        console.log('ChatRoom: Message from other user, adding to chat');
        _setChats(prev => [
          ...prev,
          {
            user,
            type: 'others',
            messageType: message?.type ?? 'text',
            message: message?.message,
            time: new Date(),
          },
        ]);

        // If chat room is NOT focused, increment message count
        // (This handles the case when user receives message while on another screen)
        if (!isFocused) {
          console.log(
            'ChatRoom: Message received while NOT focused, incrementing count',
          );
          dispatch(incrementMessageCount());
        } else {
          console.log(
            'ChatRoom: Message received while focused, NOT incrementing count',
          );
        }
      }
    },
    [dispatch, isFocused, user],
  );

  const [token, setToken] = useState(null);
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const token = await AsyncStorage.getItem('accessToken');

          setToken(token);
          if (!token) {
            dispatch(logOut());
          }
        } catch (error) {}
      })();
    }, [dispatch]),
  );

  // Reset message count when chat room comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('ChatRoom: Resetting message count on focus');
      dispatch(setMessageCount(0));
      dispatch(getClean());
    }, [dispatch]),
  );

  const PusherClient = useMemo(
    () =>
      token
        ? new Pusher(pusherConfig.key, {
            ...pusherConfig,
            auth: {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
              },
            },
            userAuthentication: {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
              },
            },
          })
        : null,
    [token],
  );

  useEffect(() => {
    if (!PusherClient) {
      return;
    }

    const connection = PusherClient.connection;
    const stateChangeHandler = states => {
      console.log('Pusher connection state_change', {
        previous: states?.previous,
        current: states?.current,
        wsHost: pusherConfig?.wsHost,
        wsPort: pusherConfig?.wsPort,
        wssPort: pusherConfig?.wssPort,
        forceTLS: pusherConfig?.forceTLS,
      });
    };
    const connectedHandler = () => {
      console.log('Pusher connection connected', {
        socketId: connection?.socket_id,
        wsHost: pusherConfig?.wsHost,
      });
    };
    const errorHandler = error => {
      console.warn('Pusher connection error', error);
    };

    connection.bind('state_change', stateChangeHandler);
    connection.bind('connected', connectedHandler);
    connection.bind('error', errorHandler);

    return () => {
      connection.unbind('state_change', stateChangeHandler);
      connection.unbind('connected', connectedHandler);
      connection.unbind('error', errorHandler);
    };
  }, [PusherClient]);

  const echo = useMemo(
    () =>
      PusherClient
        ? new Echo({
            broadcaster: 'pusher',
            client: PusherClient,
          })
        : null,
    [PusherClient],
  );

  const cleanID = cleanRequest?.id || cleanData?.id;
  useEffect(() => {
    if (!cleanID || !echo) {
      return;
    }

    echo
      .join(`chat.${cleanID}`)
      .here(users => {})
      .joining(user => {})
      .leaving(user => {})
      .listen('.chat.message', ({message, user}) => {
        incomingMessage(message, user);
      })
      .listenForWhisper('typing', e => {
        setTypingUser(e.name);
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
        }
        typingTimerRef.current = setTimeout(() => {
          setTypingUser('');
        }, 10000);
      })
      .error(e => {
        console.warn('Echo channel error', e);
      });

    return () => {
      if (cleanID && echo) {
        echo.leave(`chat.${cleanID}`);
      }
    };
  }, [cleanID, echo, incomingMessage]);

  const startTyping = useCallback(() => {
    echo.join(`chat.${cleanID}`).whisper('typing', {
      name: user?.name,
    });
  }, [echo, user, cleanID]);

  const handleDisplayImages = images => {
    const _images = images.map(image => ({
      uri: image,
    }));

    navigation.navigate('viewimages', {
      images: _images,

      startIndex: 0,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'top', 'left']}>
      <RNKeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={{marginHorizontal: 18}}>
          <Head
            custom
            pageTitle={t('chat.title')}
            // disableSecondButton={!cleanData?.images_link?.length > 1}
            // handleSecondButton={() => {
            //   handleDisplayImages(cleanData?.images_link);
            // }}
            // secondButtonTitle={t('chat.view_property_images')}
            type={2}
            navigation={navigation}
          />
        </View>
        <ChatScreenHead navigation={navigation} sender={chats?.sender} />
        {typingUser && (
          <Text style={styles.typingUser}>{typingUser} is typing ...</Text>
        )}

        <FlatList
          ref={flatListRef}
          removeClippedSubviews={false}
          style={{flex: 1}}
          contentContainerStyle={[styles.chatContent, {paddingBottom: 20}]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({animated: true})
          }
          onLayout={() => flatListRef.current?.scrollToEnd({animated: false})}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          data={_chats}
          keyExtractor={(item, index) => `${item.time}-${index}`}
          renderItem={({item, index}) => {
            const isLastItem =
              _chats.length > 0 ? _chats.length - 1 === index : true;
            const {message, type, time, first_name, messageType} = item;
            return type === 'mine' ? (
              <MyChat
                message={message}
                messageType={messageType}
                onImagePress={() => handleDisplayImages([message])}
                time={timeformatter(time)}
                key={index}
                isLastItem={isLastItem}
              />
            ) : type === 'others' ? (
              <OthersChat
                avatar={user?.avatar}
                first_name={first_name}
                message={message}
                messageType={messageType}
                onImagePress={() => handleDisplayImages([message])}
                time={timeformatter(time)}
                key={index}
              />
            ) : type === 'notification' ? (
              <View key={index} style={styles.notification}>
                <Text style={{fontSize: 12, color: '#112950'}}>{message}</Text>
                <Text style={{fontSize: 10, color: '#112950'}}>
                  {timeformatter(time)}
                </Text>
              </View>
            ) : null;
          }}
        />
        <ChatBtm pushMyChat={pushMyChat} startTyping={() => startTyping()} />
      </RNKeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatRoom;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatContent: {
    position: 'relative',
    marginHorizontal: 18,
  },
  notification: {
    backgroundColor: '#F2F4F5',
    paddingHorizontal: 16,
    paddingVertical: 4,

    alignSelf: 'center',
    marginVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  typingUser: {
    color: 'green',
    textAlign: 'center',
  },
});
