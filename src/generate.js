import readline from 'readline';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// import tf from '@tensorflow/tfjs';
// import tf from '@tensorflow/tfjs-node-gpu'; // Use '@tensorflow/tfjs-node-gpu' if running with GPU.
import tf from '@tensorflow/tfjs-node';

import { TextData, generateText } from './dataConf/data.js';

import text from './dataSet/shakespeare.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const __dirname = dirname(fileURLToPath(import.meta.url));
let modelLoad = false;

let ModelName = 'Prueba3';

rl.question('¿Que modelo Cargar?: ', function (answerLoad) {
  ModelName = answerLoad;
  modelLoad = true;
  main(modelLoad);
});

let sampleLen = 100; //60
let sampleStep = 33;

// let learningRateConf = 0.003;

let displayLengthConf = 100;

let model;

const textData = new TextData('text-data', text, sampleLen, sampleStep);

async function main(modelLoad2) {
  if (modelLoad2 === true) {
    model = await tf.loadLayersModel(
      `file://${__dirname}/models/${ModelName}/model.json`
    );
    console.log('CARGANDO...');
    postModelLoaded();
  }
}

async function postModelLoaded() {
  // compileModel(model, learningRateConf);

  // Get a seed text for display in the course of model training.
  const [seed, seedIndices] = textData.getRandomSlice();
  console.log(`Texto Original Ejemplo:\n"${seed}"\n`);

  //   const DISPLAY_TEMPERATURES = [0.85]; //Cambiado
  // const DISPLAY_TEMPERATURES = [1];
  // const DISPLAY_TEMPERATURES = [0.85, 1];

  async function generateThroughModel(temperature = 0.9) {
    console.log('cargando ----------------------');
    const generated = await generateText(
      model,
      textData,
      seedIndices,
      displayLengthConf,
      temperature
    );
    console.log(
      `Generated text (temperature=${temperature}) ---------
      ${generated}
      ------------------------------------------------------
      `
    );
  }
  // await generateThroughModel(3);
  // await generateThroughModel(2);
  // await generateThroughModel(1.5);
  await generateThroughModel(1);
  await generateThroughModel(0.5);
}
