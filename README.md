# CrytoRockets

An NFT Hack with Filecoin.

CryptoRockets combines engaging gameplay with a number of web3 and NFT concepts.
It consists of a web front-end written with Next.js, four smart contracts managed different aspects of the game and makes lots of use of [Filecoin](https://filecoin.io/) and [IPFS](https://ipfs.io/) storage.

## Getting Started

- Using Node.js v14.17.0
- Clone the repo `git clone https://github.com/kasperdoggames/nfthack.git`
- Run the install script: `./install.sh`
- Quick setup and start server and client: `./start_local.sh`
- Visit `http://localhost:3000`

The `install.sh` script installs server and client npm modules such as:

- [Hardhat Ethereum development environment](https://github.com/nomiclabs/hardhat)
- Client libraries such as [Next.js](https://github.com/vercel/next.js) and [Howler.js](https://github.com/goldfire/howler.js)

The `start_local.sh` script starts the hardhat node and deploys the contracts and mints pre-made rocket assets and sounds.

## Environment

To run the local deployment withhout issue a `.env` file is required with the following values:

```
NFTSTORAGE_API_KEY=
```

A separate client env file `./client/.env.local` is also required with the following values:

```
NEXT_PUBLIC_NFTSTORAGE_API_KEY=
```

To generate your own NFT Storage API key see [NFT Storage](https://nft.storage/).

## Running components separately

### Hardhat blockchain

To run the hardhat independently:

```
npx hardhat node
npx hardhat run ./scripts/deploy.js --network localhost
```

## Development client

To run the Next.js client independently:

```
cd ./client
npm run dev
```

## Install Metamask

To interact with the game, you should use the a cryptocurrency Wallet such as Metamask.

[Download link](https://metamask.io/download.html)

Add a couple of the Hardhat test addresses to Metamask with private keys. Only one is needed to play the game but to experiment with buying and selling rockets having a separate one makes sense.

`0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`

`0x70997970c51812dc3a010c7d01b50e0d17dc79c8`

## Technologies Used

- [Node.js](https://nodejs.org/en/)
- [Next.js](https://nextjs.org/)
- [Tailwindcss](https://tailwindcss.com/)
- [Heroicons](https://heroicons.dev/)
- [Filecoin](https://filecoin.io/)
- [IPFS](https://ipfs.io/)
- [Howler.js](https://github.com/goldfire/howler.js)
- [Hardhat](https://github.com/nomiclabs/hardhat)
- [NFT.Storage](https://nft.storage/)

## Architecture

### Repo layout

`./`

Repository structure created from `npx hardhat` command.

`./client`

The user facing web frontend using Next.js framework created using `npx create-next-app@latest` command

### Client

#### Pages

The different website pages are defined in:

`./client/pages`

Each page purpose is as follows:

`index.tsx`

home page showing hero images and menu

`builder.tsx`

carousel to randomly assemble rocket NFT used in game from a large list of rocket parts for nose, fuselage and tail.

`hanger.tsx`

A page that shows all of the rocket NFTs that the logged in user (based on their Wallet address) owns. Provide options to select a different rocket to play with when a user has more than one and also the ability to initiate selling a rocket.

`launch.tsx` -

The game area where users can play the rocket game using their selected rocket NFT.

To play a user holds down the mouse button to launch the rocket. They then can release the mouse button before running out of fuel and separate the next rocket stage to reach the greatest height possible with their quick reactions and the current rockets speed and fuel capabilities.

Credit balance is shown on the page and provide funds to increase the speed, fuel, earnings per flight and offline earnings capabilities.

Any update to rocket capabilities or recording height reached when playing the game involve interation with the Wallet to send a transaction to the contract managing the game state.

`marketplace.tsx`

A page to manage the buying and selling of rocket NFTs. Allows a user to purchase a rocket with greater capabilities than they current own.

`settings.tsx`

A page for game settings that current allows the selection of sound effects used in the game. These sound effects are also held as NFTs in a smart contract.

#### Components

`ProcessingIndicator.tsx`

A component to provide a consistent spinning progress indicator to be used on pages that have long running operations such as Wallet operations against the smart contracts.

#### Hooks

`use-processing-indicator.tsx`

A react hook that works in conjunctions with `ProcessingIndicator.tsx` to provide a generic spinning progress indicator.

#### Other

`./client/contract_addresses.js`

A file that is automatically updated by the `./scripts/deploy.js` deployment script to include all of the different smart contract addresses that need to be referenced by the pages.

`./client/tailwind.config.js`

We use [TailwindCSS](https://tailwindcss.com/) to provide CSS styling throughout the app. The default tailwind configuration file has been augmented to include additional fonts and colours used in the website.

`./client/public`

Next.js convention is that this folder becomes available as the `/` folder of a website.

We used it to provide access to fonts, sounds and other images used through the website.

### Contracts

`RocketPart.sol`

An ERC721 compatible contract to hold a list of rocket part image NFTs. Each NFT has metadata to indicate it is an image for either a nose, fuselage or tail section of a final rocket NFT image.

`RocketCharacter.sol`

An ERC721 compatible contract to hold the game characters, NFT images, that has been assembled from parts in the `RocketPart.sol` contract.

Also has functions that allow management of the buying and selling (transferring ownership) via the `Market.sol` contract.

`Market.sol`

A contract that manages the buying and selling of the NFTs held in the `RocketCharacter.sol` contract.

`SoundEffect.sol`

An ERC721 compatible contract to hold the sound effects available in the game. Each sound effect has metadata to describe the role that it takes in the game of either background music, explosion etc.

##

### Scripts

`./scripts/deploy.js`

This script deploys all the smart contracts contracts.

It takes into account some dependancies between contracts such as `RocketCharacter.sol` needing the contract address for the `Market.sol` address to allow NFT ownership to be delegated using the `setApprovalForAll` function call.

The deploy script composes the command lines, taking into account actual contract addresses for Hardhat custom `tasks` mentioned below.

### Tasks

Some helper tasks were created, and use by the installation `.sh` scripts mentioned in the `Getting Started` section above.

`./rockets/generate_rocket_character.js`

Creates a rocket NFT in the `RocketCharacter.sol` smart contract given a reference to a filepath to an image.

`./rockets/generate_rocket_part.js`

Creates a rocket part NFT in the `RocketPart.sol` smart contract given a reference to a filepath to an image and the type of the image; nose, fuselage or tail.

`./rockets/get_token_attributes/js`

Quickly retrieve the NFT token attributes for a contract given a token identifier.

`./rockets/populate_rocket_parts.js`

A task to take a folder of rocket part images and upload those into the `RocketPart.sol` smart contract. It handles using the NFT.Storage API to store the images in Filecoin/IPFS.

`./soundeffects/generate_soundeffect.js`

Create an audio NFT in the `SoundEffect.sol` smart contract given a filepath to the audio file.

`./soundeffects/populate_soundeffects.js`

A task that takes a folder of different sound effect audio files and uploads those into the `SoundEffect.sol` smart contract. It handles using the NFT.Storage API to store the images in Filecoin/IPFS.
