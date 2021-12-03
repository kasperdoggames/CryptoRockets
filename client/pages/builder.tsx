import React, { useEffect, useState, useRef } from "react";
import Carousel from "react-simply-carousel";
import eth from "../support/eth";
import Footer from "./components/Footer";
import NavBar from "./components/NavBar";
import WalletConnectButton from "./components/WalletConnectButton";
import { Howl } from "howler";

const RocketBuilder = () => {
  const [activeSlide1, setActiveSlide1] = useState(0);
  const [activeSlide2, setActiveSlide2] = useState(0);
  const [activeSlide3, setActiveSlide3] = useState(0);
  const [speed, setSpeed] = useState(100);
  const [easing, setEasing] = useState("ease-in-out");
  const [autoplay, setAutoplay] = useState(false);
  const [itemsToShow, setItemsToShow] = useState(3);
  const [currentAccount, setCurrentAccount] = useState("");
  const [rocketPartsNose, setRocketPartsNose] = useState([]);
  const [rocketPartsFuselage, setRocketPartsFuselage] = useState([]);
  const [rocketPartsTail, setRocketPartsTail] = useState([]);
  const [underConstruction, setUnderConstruction] = useState(false);
  const [firstTime, setFirstTime] = useState(true);
  const rocketCanvas = useRef(null);
  const noseRef = useRef(null);
  const fuselageRef = useRef(null);
  const tailRef = useRef(null);
  const slotMachineSpinEffect = useRef<Howl | null>(null);
  const slotMachineDingEffect = useRef<Howl | null>(null);
  const [isReadyToMint, setIsReadyToMint] = useState(false);

  useEffect(() => {
    const { ethereum } = window;
    eth.isWalletConnected(ethereum, currentAccount, setCurrentAccount);
  }, [currentAccount]);

  useEffect(() => {
    const { ethereum } = window;
    if (ethereum) {
      ethereum.on("accountsChanged", () => {
        eth.isWalletConnected(ethereum, currentAccount, setCurrentAccount);
      });
    }

    slotMachineSpinEffect.current = new Howl({
      src: ["/sounds/slot_machine_spin.mp3"],
      format: ["mp3"],
      loop: true,
      volume: 1,
    });

    slotMachineDingEffect.current = new Howl({
      src: ["/sounds/slot_machine_ding.mp3"],
      format: ["mp3"],
      loop: false,
      volume: 1,
    });

    return () => {
      if (slotMachineSpinEffect.current) {
        slotMachineSpinEffect.current.stop();
      }
    };
  }, []);

  const RocketPartTypeEnum = {
    nose: 0,
    fuselage: 1,
    tail: 2,
  };

  const partIndexToType = (index: number) =>
    Object.keys(RocketPartTypeEnum)[index];

  const extractRocketParts = (parts, partType) =>
    parts
      .filter((f) => f.partType === partType)
      .map((part) => {
        const imagePath = eth.toIpfsGatewayURL(part.tokenUri.toString());
        const imageType = partIndexToType(Number(part.partType));
        return { imagePath, imageType };
      });

  useEffect(() => {
    if (currentAccount) {
      try {
        const { ethereum } = window;
        const rocketPartContract = eth.getRocketPartContract(ethereum);
        if (rocketPartContract) {
          rocketPartContract.getAllRocketParts().then((parts) => {
            const newRocketPartsNose = extractRocketParts(
              parts,
              RocketPartTypeEnum.nose
            );
            setRocketPartsNose(newRocketPartsNose);

            const newRocketPartsFuselage = extractRocketParts(
              parts,
              RocketPartTypeEnum.fuselage
            );
            setRocketPartsFuselage(newRocketPartsFuselage);

            const newRocketPartsTail = extractRocketParts(
              parts,
              RocketPartTypeEnum.tail
            );
            setRocketPartsTail(newRocketPartsTail);
          });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }, [currentAccount]);

  const buildRocketImage = async (noseIndex, fuselageIndex, tailIndex) => {
    const ctx = rocketCanvas.current.getContext("2d");
    if (!ctx) {
      return;
    }

    // function to extract image part images from individual rocket part images and then combine by pasting into a single rocket image on a 600x600 canvas
    const combineRocketParts = (
      part,
      imagePath,
      outputCtx,
      cutX,
      cutY,
      cutWidth,
      cutHeight,
      pasteX,
      pasteY
    ) => {
      return new Promise((resolve, _) => {
        // console.log(`combineRocketParts: ${part}`);
        const tempImage = new Image();
        tempImage.crossOrigin = "anonymous";
        tempImage.src = imagePath;
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 600;
        tempCanvas.height = 600;
        const tempCtx = tempCanvas.getContext("2d");
        tempImage.onload = () => {
          tempCtx.drawImage(tempImage, 0, 0);
          const imageData = tempCtx.getImageData(
            cutX,
            cutY,
            cutWidth,
            cutHeight
          );
          outputCtx.putImageData(imageData, pasteX, pasteY);
          // console.log(`outputCtx: ${part}`);
          resolve(part);
        };
      });
    };

    await combineRocketParts(
      "nose",
      rocketPartsNose[noseIndex].imagePath,
      ctx,
      0,
      232,
      600,
      135,
      0,
      0
    );

    await combineRocketParts(
      "fuselage",
      rocketPartsFuselage[fuselageIndex].imagePath,
      ctx,
      0,
      165,
      600,
      2705,
      0,
      135
    );

    await combineRocketParts(
      "tail",
      rocketPartsTail[tailIndex].imagePath,
      ctx,
      0,
      202,
      600,
      195,
      0,
      405
    );
  };

  const handleMintRocketCharacter = async () => {
    setIsReadyToMint(false);
    const getImgBlob = async (): Promise<Blob | null> => {
      const blob: Blob | null = await new Promise((resolve) => {
        if (rocketCanvas.current) {
          rocketCanvas.current.toBlob((blob) => {
            resolve(blob);
          });
        }
      });
      return blob;
    };

    const blob = await getImgBlob();
    const result = await fetch("api/setRocket", {
      method: "POST",
      body: blob,
    });
    const json = await result.json();
    const ipfsUri = json.ipfsUri;
    try {
      const { ethereum } = window;
      const rocketCharacterContract = eth.getRocketCharacterContract(ethereum);
      let tx = rocketCharacterContract
        ? await rocketCharacterContract.mintToken(ipfsUri)
        : null;
      console.log("Mining rocket character...please wait.");
      const receipt = await tx.wait();
      const tokenId = Number(receipt.events[0].args[2]);
      console.log(`Minted RocketCharacter #${tokenId}`);
      setIsReadyToMint(false);
    } catch (err) {
      alert(`Sorry, we were unable to mint that rocket. Code: ${err?.code}`);
      setIsReadyToMint(true);
      console.log(err);
    }
  };

  const createRocketClickHandler = () => {
    setAutoplay(true);
    setFirstTime(false);
    slotMachineSpinEffect.current.play();
    const ctx = rocketCanvas.current.getContext("2d");
    ctx.clearRect(0, 0, 600, 600);
    setUnderConstruction(true);
    setTimeout(() => {
      setAutoplay(false);
      setUnderConstruction(false);
      console.log(
        `Rocket combo: ${noseRef.current + 1}:${fuselageRef.current + 1}:${
          tailRef.current + 1
        }`
      );
      slotMachineSpinEffect.current.stop();
      slotMachineDingEffect.current.play();
      buildRocketImage(noseRef.current, fuselageRef.current, tailRef.current);
      setIsReadyToMint(true);
    }, Number(Math.random() * 5000) + 2000);
  };

  const onConnect = () => {
    eth.connectWallet(setCurrentAccount);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <NavBar />
      <h1 className="py-4 text-5xl font-bold text-white">Rocket Builder</h1>
      {currentAccount === "" ? (
        <WalletConnectButton onConnect={onConnect} />
      ) : (
        <div className="flex">
          <div>
            {rocketPartsNose.length > 0 &&
            rocketPartsFuselage.length > 0 &&
            rocketPartsTail.length > 0 ? (
              <div className="relative w-[350px] h-[385px] border-8 bg-gray-800 border-yellow-500 rounded-3xl m-4 overflow-hidden">
                <Carousel
                  containerProps={{
                    style: {
                      width: "350px",
                      justifyContent: "space-between",
                    },
                  }}
                  activeSlideIndex={activeSlide1}
                  activeSlideProps={{
                    style: {
                      transform: `scale(1.5)`,
                    },
                  }}
                  onRequestChange={(v) => {
                    noseRef.current = v;
                    setActiveSlide1(v);
                  }}
                  itemsToShow={itemsToShow}
                  speed={speed}
                  autoplay={autoplay}
                  autoplayDirection={"forward"}
                  easing={easing}
                  centerMode={true}
                  infinite={true}
                >
                  {rocketPartsNose.map((item, index) => (
                    <div
                      style={{
                        width: 140,
                        height: 120,
                        textAlign: "center",
                        lineHeight: "240px",
                        boxSizing: "border-box",
                      }}
                      key={index}
                    >
                      <img
                        src={item.imagePath}
                        data-index={index}
                        style={{ width: 140, height: 140 }}
                      />
                    </div>
                  ))}
                </Carousel>
                <Carousel
                  updateOnItemClick
                  containerProps={{
                    style: {
                      width: "350px",
                      justifyContent: "space-between",
                    },
                  }}
                  activeSlideIndex={activeSlide2}
                  activeSlideProps={{
                    style: {
                      transform: `scale(1.5)`,
                    },
                  }}
                  onRequestChange={(v) => {
                    fuselageRef.current = v;
                    setActiveSlide2(v);
                  }}
                  itemsToShow={itemsToShow}
                  speed={speed}
                  autoplay={autoplay}
                  autoplayDirection={"backward"}
                  easing={easing}
                  centerMode={true}
                >
                  {rocketPartsFuselage.map((item, index) => (
                    <div
                      style={{
                        width: 140,
                        height: 120,
                        textAlign: "center",
                        lineHeight: "240px",
                        boxSizing: "border-box",
                      }}
                      key={index}
                    >
                      <img
                        src={item.imagePath}
                        style={{ width: 140, height: 140 }}
                      />
                    </div>
                  ))}
                </Carousel>
                <Carousel
                  updateOnItemClick
                  containerProps={{
                    style: {
                      width: "350px",
                      justifyContent: "space-between",
                    },
                  }}
                  activeSlideIndex={activeSlide3}
                  activeSlideProps={{
                    style: {
                      transform: `scale(1.5)`,
                    },
                  }}
                  onRequestChange={(v) => {
                    tailRef.current = v;
                    setActiveSlide3(v);
                  }}
                  itemsToShow={itemsToShow}
                  speed={speed}
                  autoplay={autoplay}
                  autoplayDirection={"forward"}
                  easing={easing}
                  centerMode={true}
                >
                  {rocketPartsTail.map((item, index) => (
                    <div
                      style={{
                        width: 140,
                        height: 120,
                        textAlign: "center",
                        lineHeight: "240px",
                        boxSizing: "border-box",
                      }}
                      key={index}
                    >
                      <img
                        src={item.imagePath}
                        style={{ width: 140, height: 140 }}
                      />
                    </div>
                  ))}
                </Carousel>
                <div className="absolute top-0 left-0 w-2/5 h-full bg-gradient-to-r from-gray-700 to-transparent"></div>
                <div className="absolute top-0 right-0 w-2/5 h-full bg-gradient-to-l from-gray-700 to-transparent"></div>
              </div>
            ) : null}
            <div className="w-full p-4 text-center">
              <button
                className="px-4 py-4 font-bold text-white bg-green-600 rounded-xl hover:bg-indigo-100 hover:text-indigo-600"
                onClick={createRocketClickHandler}
              >
                BUILD MY ROCKET
              </button>
            </div>
          </div>
          <div>
            <div className="relative flex items-center justify-around w-[350px] h-[385px] border-8 bg-gray-800 border-yellow-500 rounded-3xl m-4">
              <canvas
                className={`w-[350px] h-[350px] ${
                  underConstruction ? "invisible" : "visible"
                }`}
                height={600}
                width={600}
                ref={rocketCanvas}
              ></canvas>
              <img
                className={`absolute inset-0 w-full h-full ${
                  underConstruction ? "block" : "hidden"
                }`}
                src="under_construction.gif"
              />
            </div>
            <div className="w-full p-4 text-center">
              <button
                className={`px-4 py-4 font-bold text-white bg-green-600  rounded-xl hover:bg-indigo-100 hover:text-indigo-600 ${
                  !isReadyToMint ? "opacity-20" : ""
                }`}
                disabled={!isReadyToMint}
                onClick={handleMintRocketCharacter}
              >
                I WANT THAT ONE...
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-end justify-center flex-grow h-full">
        <Footer />
      </div>
    </div>
  );
};

export default RocketBuilder;
