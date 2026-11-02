import React, {useState} from 'react';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import {StyleSheet, TouchableOpacity, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';
import Head from '../../components/Shared/Head';
import {rateUser} from '../../store/actions/dashboard/rateUser';
import {clearPendingRatings} from '../../store/reducer/userSlice';
import Text from '../../components/Shared/Text';
import AntDesign from "@react-native-vector-icons/ant-design";
import FontAwesome from "@react-native-vector-icons/fontawesome";
import {useFormik} from 'formik';
import Button from '../../components/Shared/Button';
import TextInputField from '../../components/Inputs/TextInputField';
import {formHandler} from '../../utils/formhandler';
import KeyboardAvoidingView from '../../components/Shared/KeyboardAvoidingView';
import {logHelper} from '../../utils/logHelper';
import {useTranslation} from 'react-i18next';

const Rate = ({navigation, route}) => {
  const {t} = useTranslation();
  const acceptedCleanRequest = useSelector(
    state => state.user.acceptedCleanRequest,
  );
  // const {id, status} = route.params;
  const id = route.params?.id;
  const status = route.params?.status;

  const dispatch = useDispatch();

  const [ratings, setRatings] = useState(0);

  const handleSubmit = values => {
    const payload = {
      id: id,
      status: status,
      review_rating: ratings,
      review_comment: values.review_comment,
    };

    dispatch(rateUser({payload, navigation}));
    dispatch(clearPendingRatings());
  };

  const form = useFormik({
    initialValues: {},
    onSubmit: handleSubmit,
  });

  return (
    <ScreenContainer style={styles.container}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 32,
          paddingBottom: 100, // Extra padding for button visibility
        }}>
        <Head pageTitle={t('rate.page_title')} type={2} navigation={navigation} />
        <View
          style={{
            backgroundColor: '#F5F5F6',
            width: '100%',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 20,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
          }}>
          <Text medium style={{fontSize: 16}}>
            {t('rate.review_rating_label')}
          </Text>
          <Text bold style={{fontSize: 36}}>
            {ratings}.0
          </Text>
          <View
            style={{
              flexDirection: 'row',
              gap: 4,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            {[1, 2, 3, 4, 5].map(index => (
              <TouchableOpacity key={index} onPress={() => setRatings(index)}>
                <FontAwesome
                  fill={'red'}
                  style={{color: '#F8C22E'}}
                  name={index <= ratings ? 'star' : 'star-o'}
                  size={32}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{fontSize: 16, marginTop: 24}}>
            {t('rate.give_rating_prompt')}
          </Text>
        </View>

        <TextInputField
          custom
          placeholder={t('rate.add_review_placeholder')}
          style={{borderColor: '#000'}}
          {...formHandler('review_comment', form)}
          label={t('rate.review_comments_label')}
          type="text-area"
          mainStyles={{width: '100%'}}
          // disabled={!ratings}
        />

        <Button
          text={t('rate.submit')}
          disabled={!ratings}
          pressed={form.handleSubmit}
          height={52}
          style={{
            width: '100%',
            borderRadius: 8,
            marginVertical: 16,
          }}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default Rate;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  innerContainer: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  top: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    flex: 1,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
  },
  imageContainer: {
    marginTop: 8,
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#b9b3ef',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  btm: {
    flex: 1,
    backgroundColor: '#f3f5f7',
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  inner: {
    flex: 1,
    height: 200,
    borderRadius: 8,
  },
});
