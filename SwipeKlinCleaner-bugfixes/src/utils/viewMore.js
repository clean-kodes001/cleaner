import {getPaginatedItems} from '../store/actions/user/getPaginatedItems';

export const handleViewMore = ({
  dispatch,
  pageUrl,
  distructurer,
  setNextPage,
  setPage,
  setLastViewedList,
}) => {
  dispatch(
    getPaginatedItems({
      path: pageUrl,
      callBack: ({[distructurer]: {data, next_page_url}}) => {
        setPage(prev => [...prev, ...data]),
          setLastViewedList(prev => [...prev, ...data]),
          setNextPage(next_page_url);
      },
    }),
  );
};
