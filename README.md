# logshare

Simple log-sharing utility built with Node.js, Redis and Cloudant.

## Installation

    npm install -g logshare
  
## Running

    >tail -f /var/log/system.log | logshare
    Share URL: https://logshare.mybluemix.net/share/kkdgapgdx

Put the URL in your browser and share it with the people you want to share your data with.

![Demo](https://raw.githubusercontent.com/glynnbird/logshare-server/master/public/img/demo.gif)

Alternatively, they can run logshare too to consume the data in their terminal like this:

    > logshare https://logshare.mybluemix.net/share/kkdgapgdx

or

    > logshare kkdgapgdx

to consume the stream of logs at their terminal.

## Stopping
  
    Ctrl-C

When `logshare` is killed, it deletes the data you streamed to it.

## Live Demo

Visit [https://logshare.mybluemix.net](https://logshare.mybluemix.net) for a live demo.


## What is this code?

This is the server-side code for `logshare`. The client-side code lives in a [separate repository](https://github.com/glynnbird/logshare-client).