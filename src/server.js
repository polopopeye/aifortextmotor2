import readline from 'readline';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import tf from '@tensorflow/tfjs';
// import tfn from '@tensorflow/tfjs-node';
// import tf from '@tensorflow/tfjs-node-gpu'; // Use '@tensorflow/tfjs-node-gpu' if running with GPU.

import {
  TextData,
  createModel,
  compileModel,
  fitModel,
  generateText,
} from './dataConf/data.js';

import text from './dataSet/shakespeare.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const __dirname = dirname(fileURLToPath(import.meta.url));
let modelLoad = false;

const ModelName = 'Prueba3';
let displayResults = false;

rl.question('¿Cargar modelo anterior? Y/n : ', function (answerLoad) {
  if (answerLoad === 'Y') {
    console.log('CARGANDO ANTERIOR');
    modelLoad = true;
    main(modelLoad);
  } else {
    modelLoad = false;
    rl.question(
      '¿Seguro? Y esto hara que pierdas el que tenias.... ',
      function (answerLoad) {
        if (answerLoad === 'Y') {
          console.log('CREANDO NUEVO');
          main(modelLoad);
        } else {
          console.log('CANCELADO! ');
        }
      }
    );
  }
});

let sampleLen = 300; //60
let sampleStep = 30;
let firstLayerSizeConf = '128,128'; //'128,128';
// let learningRateConf = 1e-2;
// let learningRateConf = 1e-3;
let learningRateConf = 0.003;
// let epochConf = 5; //150
let epochConf = 150; //150
let examplesPerEpochConf = 1500; //10000
let batchSizeConf = 128; //128
let validationSplitConf = 0.0625;
let displayLengthConf = 120;

let model;

const textData = new TextData('text-data', text, sampleLen, sampleStep);

async function main(modelLoad2) {
  if (modelLoad2 === true) {
    model = await tf.loadLayersModel(
      `file://${__dirname}/models/${ModelName}/model.json`
    );
    console.log('CARGANDO...');
    postModelLoaded();
  } else {
    // Convert lstmLayerSize from string to number array before handing it
    // to `createModel()`.
    const lstmLayerSize =
      firstLayerSizeConf.indexOf(',') === -1
        ? Number.parseInt(firstLayerSizeConf)
        : firstLayerSizeConf.split(',').map((x) => Number.parseInt(x));

    model = createModel(
      textData.sampleLen(),
      textData.charSetSize(),
      lstmLayerSize
    );
    postModelLoaded();
  }
}

function postModelLoaded() {
  compileModel(model, learningRateConf);

  // Get a seed text for display in the course of model training.
  const [seed, seedIndices] = textData.getRandomSlice();
  console.log(`Seed text:\n"${seed}"\n`);

  //   const DISPLAY_TEMPERATURES = [0.85]; //Cambiado
  const DISPLAY_TEMPERATURES = [1];
  //   const DISPLAY_TEMPERATURES = [0.5, 0.85];

  let epochCount = 0;

  function setChrono(chronoMetro = 0) {
    setInterval(() => {
      chronoMetro++;
      if (
        epochCount === 10 ||
        epochCount === 5 ||
        epochCount === 30 ||
        epochCount === 60
      ) {
        console.log(epochCount + ' en... ' + chronoMetro + ' Segundos!!');
      }
    }, 1000);
  }
  setChrono();

  fitModel(
    model,
    textData,
    epochConf,
    examplesPerEpochConf,
    batchSizeConf,
    validationSplitConf,
    {
      onTrainBegin: async () => {
        epochCount++;
        console.log(`Epoch ${epochCount} of ${epochConf}:`);
      },
      onTrainEnd: async () => {
        console.log(`Saving model...`);
        await model.save(`file://${__dirname}/models/${ModelName}`);
        console.log(`Saved model...`);
        if (displayResults) {
          DISPLAY_TEMPERATURES.forEach(async (temperature) => {
            const generated = await generateText(
              model,
              textData,
              seedIndices,
              displayLengthConf,
              temperature
            );
            console.log(
              `Generated text (temperature=${temperature}):\n` +
                `"${generated}"\n`
            );
          });
        }
      },
    }
  );
}
