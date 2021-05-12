import readline from 'readline';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
// import tf from '@tensorflow/tfjs';
import tf from '@tensorflow/tfjs-node';
// import tf from '@tensorflow/tfjs-node-gpu'; // Use '@tensorflow/tfjs-node-gpu' if running with GPU.

import {
  TextData,
  createModel,
  compileModel,
  fitModel,
} from './dataConf/data.js';

import text from './dataSet/shakespeare.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
let importedEpochCount = 0;

const __dirname = dirname(fileURLToPath(import.meta.url));
let modelLoad = false;

const ModelName = 'Prueba8';

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
// https://storage.googleapis.com/tfjs-examples/lstm-text-generation/dist/index.html
let sampleLen = 100; //VALORES FIJOS
let sampleStep = 33; // El 5% del input de arriba
// let sampleStep = 5; // El 5% del input de arriba

let firstLayerSizeConf = '256'; //'128,128'; //VALORES FIJOS
// let learningRateConf = 1e-2;

let learningRateConf = 0.03;

let epochConf = 16384; //VECES QUE SE REALIZA EL TEST NO AFECTA
let validationSplitConf = 0.0625; //porcentaje Testing/Training 0.2 80% training and 20% testing

let examplesPerEpochConf = 4096; //UTILIZA MEMORIA RAM 4.4 - 10 son 400MB

let batchSizeConf = 512; //Cantidad de datos dentro de cada ciclo (Mejor cuanto mas alto) Consume Ram

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

async function postModelLoaded() {
  compileModel(model, learningRateConf);

  // Get a seed text for display in the course of model training.
  const [seed] = textData.getRandomSlice();
  console.log(`Seed text:\n"${seed}"\n`);

  let epochCount = 0;

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
        console.log(`¡SAVING model!`);
        await model.save(`file://${__dirname}/models/${ModelName}`);
        console.log(`SAVED model....${ModelName}  OK`);
        let dirFileTxt = `src/models/${ModelName}/${ModelName}.txt`;
        fs.access(dirFileTxt, (err) => {
          if (err) {
            // console.log('The file does not exist.');
            fs.writeFile(dirFileTxt, `${epochCount}`, function () {
              console.log('Creado Correctamente');
            });
          } else {
            // console.log('The file exists.');
            fs.readFile(dirFileTxt, 'utf8', function (err, data) {
              if (err) {
                return console.log(err);
              }
              importedEpochCount = parseInt(data);
              let newEpochCounter = importedEpochCount + 1;
              fs.writeFile(dirFileTxt, `${newEpochCounter}`, function () {
                console.log('Contador Actualizado');
                console.log(newEpochCounter);
              });
            });
          }
        });
      },
    }
  );
}
