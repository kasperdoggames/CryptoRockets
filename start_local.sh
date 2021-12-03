#!/bin/bash
set -e

run_client(){
  cd client
  npm run dev
}

configure_hardhat(){
  npx hardhat run ./scripts/deploy.js --network localhost
  export $(xargs < load_contract_vars)
  npx hardhat populate-rocket-parts --contract $ROCKETPART_CONTRACT_ADDRESS --dirpath ../../assets/rocketparts/ --network localhost
  npx hardhat populate-soundeffects --contract $SOUNDEFFECT_CONTRACT_ADDRESS --dirpath ../../assets/soundeffects/ --network localhost
}

run_hathat_node(){
  npx hardhat node
}

run_hathat_node | cat - &
configure_hardhat
run_client &
wait