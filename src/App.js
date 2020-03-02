import React, { useReducer, useRef } from 'react';

import { useFetch, useInfiniteScroll, useLazyLoading } from './customHooks'
import './index.css';

function App() {
  const imgReducer = (state, action) => {
    switch (action.type) {
      case 'STACK_IMAGES':
        return { ...state, images: state.images.concat(action.images) }
      case 'FETCHING_IMAGES':
        return { ...state, fetching: action.fetching }
      default:
        return state;
    }
  }

  const pageReducer = (state, action) => {
    switch (action.type) {
      case 'ADVANCE_PAGE':
        return { ...state, page: state.page + 1 }
      default:
        return state;
    }
  }

  const [pager, pagerDispatch] = useReducer(pageReducer, { page: 0 })
  const [imgData, imgDispatch] = useReducer(imgReducer, { images: [], fetching: true, })

  let bottomBoundaryRef = useRef(null);
  useFetch(pager, imgDispatch);
  useLazyLoading('.card-img-top', imgData.images)
  useInfiniteScroll(bottomBoundaryRef, pagerDispatch);

  return (
    <div className="">
      <nav className="navbar bg-light">
        <div className="container">
          <a className="navbar-brand" href="/#">
            <h2>Infinite scroll + image lazy loading</h2>
          </a>
        </div>
      </nav>

      <div id='images' className="container">
        <div className="row">
          {imgData.images.map((image, index) => {
            const { author, download_url } = image
            return (
              <div key={index} className="card">
                <div className="card-body ">
                  <img
                    alt={author}
                    data-src={download_url}
                    className="card-img-top"
                    src={'https://picsum.photos/id/870/300/300?grayscale&blur=2'}
                  />
                </div>
                <div className="card-footer">
                  <p className="card-text text-center text-capitalize text-primary">Shot by: {author}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {imgData.fetching && (
        <div className="text-center bg-secondary m-auto p-3">
          <p className="m-0 text-white">Getting images</p>
        </div>
      )}
      <div id='page-bottom-boundary' style={{ border: '1px solid red' }} ref={bottomBoundaryRef}></div>
    </div>
  );
}

export default App;
