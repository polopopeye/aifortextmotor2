import { dirname } from 'path';
import { fileURLToPath } from 'url';
// import {ModelName} from
// import tf from '@tensorflow/tfjs';
// import tf from '@tensorflow/tfjs-node-gpu'; // Use '@tensorflow/tfjs-node-gpu' if running with GPU.

import tf from '@tensorflow/tfjs-node';
// import tf from '@tensorflow/tfjs-node-gpu'; // Use '@tensorflow/tfjs-node-gpu' if running with GPU.

import {
  ModelName,
  // batchSizeConf,
  sampleLen,
  sampleStep,
  displayLengthConf,
} from './dataConf/variables.js';

import { TextData, generateText } from './dataConf/data.js';

import text from './dataSet/shakespeare.js';

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

const __dirname = dirname(fileURLToPath(import.meta.url));
// let modelLoad = false;

// rl.question('¿Que modelo Cargar?: ', function (answerLoad) {
//   ModelName = answerLoad;
//   modelLoad = true;
main();
// });

// let learningRateConf = 0.003;

let model;

const textData = new TextData('text-data', text, sampleLen, sampleStep);

async function main() {
  model = await tf.loadLayersModel(
    `file://${__dirname}/models/${ModelName}/model.json`
  );
  console.log('CARGANDO...');
  console.log(ModelName);
  postModelLoaded();
}

async function postModelLoaded() {
  // compileModel(model, learningRateConf);

  // Get a seed text for display in the course of model training.
  const [seed, seedIndices] = textData.getRandomSlice();
  console.log(`Texto Seed 0 Ejemplo:\n"${seed}"\n`);

  async function generateThroughModel(temperature = 0.9) {
    const generated = await generateText(
      seed,
      model,
      textData,
      seedIndices,
      displayLengthConf,
      temperature
    );
    console.log(
      `---------------- Generated text (temperature=${temperature}) ----------------
      ${generated}
      ------------------------------------------------------------------------------
      `
    );
  }
  // await generateThroughModel(3);
  // await generateThroughModel(2);
  // await generateThroughModel(1.5);
  // await generateThroughModel(1);
  // await generateThroughModel(0.8);
  await generateThroughModel(1);
  // await generateThroughModel(0.6);
  // await generateThroughModel(0.5);
  // await generateThroughModel(0.4);
  await generateThroughModel(0.7);
  // await generateThroughModel(0.2);
  // await generateThroughModel(0.1);
}
