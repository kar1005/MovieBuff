import React from 'react'
import Header from './../shared/Header'

function Layout({children}) {
    return (
      <>
        <Header />
        <div>{children}</div>
      </>
    )
  }

export default Layout
