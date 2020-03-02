import React, { useEffect, useReducer } from 'react';

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

  const [imgData, imgDispatch] = useReducer(imgReducer, { images: [], fetching: true, })

  // make API calls
  useEffect(() => {
    imgDispatch({ type: 'FETCHING_IMAGES', fetching: true })
    fetch('https://picsum.photos/v2/list?page=0&limit=10')
      .then(data => data.json())
      .then(images => {
        imgDispatch({ type: 'STACK_IMAGES', images })
        imgDispatch({ type: 'FETCHING_IMAGES', fetching: true })
      })
      .catch(e => {
        console.error(e)
      })
  }, [ imgDispatch ])

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
                    className="card-img-top"
                    src={download_url}
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
    </div>
  );
}

export default App;
