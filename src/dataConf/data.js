// import tf from '@tensorflow/tfjs'; //NO FUNCIONA PORQUE UTILIZA FILE HANDLERS

import tf, { selu } from '@tensorflow/tfjs-node';
import readline from 'readline';
import fs from 'fs';
import {
  // ModelName,
  batchSizeConf,
  sampleLen,
  sampleStep,
  validationSplitConf,
  displayLengthConf,
  NotasDeBitacora,
} from './variables.js';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
// import tf from '@tensorflow/tfjs-node-gpu'; // Use '@tensorflow/tfjs-node-gpu' if running with GPU.
const __dirname = dirname(fileURLToPath(import.meta.url));

// TODO(cais): Support user-supplied text data.

/**
 * A class for text data.
 *
 * This class manages the following:
 *
 * - Converting training data (as a string) into one-hot encoded vectors.
 * - Drawing random slices from the training data. This is useful for training
 *   models and obtaining the seed text for model-based text generation.
 */

export class TextData {
  /**
   * Constructor of TextData.
   *
   * @param {string} dataIdentifier An identifier for this instance of TextData.
   * @param {string} textString The training text data.
   * @param {number} sampleLen Length of each training example, i.e., the input
   *   sequence length expected by the LSTM model.
   * @param {number} sampleStep How many characters to skip when going from one
   *   example of the training data (in `textString`) to the next.
   */
  constructor(dataIdentifier, textString, sampleLen, sampleStep) {
    tf.util.assert(
      sampleLen > 0,
      `Expected sampleLen to be a positive integer, but got ${sampleLen}`
    );
    tf.util.assert(
      sampleStep > 0,
      `Expected sampleStep to be a positive integer, but got ${sampleStep}`
    );

    if (!dataIdentifier) {
      throw new Error('Model identifier is not provided.');
    }

    this.dataIdentifier_ = dataIdentifier;

    this.textString_ = textString;
    this.textLen_ = textString.length;
    this.sampleLen_ = sampleLen;
    this.sampleStep_ = sampleStep;

    this.getCharSet_();
    this.convertAllTextToIndices_();
  }

  /**
   * Get data identifier.
   *
   * @returns {string} The data identifier.
   */
  dataIdentifier() {
    return this.dataIdentifier_;
  }

  /**
   * Get length of the training text data.
   *
   * @returns {number} Length of training text data.
   */
  textLen() {
    return this.textLen_;
  }

  /**
   * Get the length of each training example.
   */
  sampleLen() {
    return this.sampleLen_;
  }

  /**
   * Get the size of the character set.
   *
   * @returns {number} Size of the character set, i.e., how many unique
   *   characters there are in the training text data.
   */
  charSetSize() {
    return this.charSetSize_;
  }

  /**
   * Generate the next epoch of data for training models.
   *
   * @param {number} numExamples Number examples to generate.
   * @returns {[tf.Tensor, tf.Tensor]} `xs` and `ys` Tensors.
   *   `xs` has the shape of `[numExamples, this.sampleLen, this.charSetSize]`.
   *   `ys` has the shape of `[numExamples, this.charSetSize]`.
   */
  nextDataEpoch(numExamples) {
    this.generateExampleBeginIndices_();

    // if (numExamples == null) {
    numExamples = this.exampleBeginIndices_.length;
    // }
    console.log('NUMEXAMPLES DETECTADOS');
    console.log(numExamples);

    const xsBuffer = new tf.TensorBuffer([
      numExamples, //cuantos mas mejor.
      this.sampleLen_, //30 //prueba con 30...
      this.charSetSize_, //num de caracteres posibles
    ]);
    const ysBuffer = new tf.TensorBuffer([numExamples, this.charSetSize_]);
    for (let i = 0; i < numExamples; ++i) {
      const beginIndex =
        this.exampleBeginIndices_[
          this.examplePosition_ % this.exampleBeginIndices_.length
        ];
      // console.log('beginIndex');
      // console.log(beginIndex);
      for (let j = 0; j < this.sampleLen_; ++j) {
        xsBuffer.set(1, i, j, this.indices_[beginIndex + j]);
        // console.log('this.indices_[beginIndex + j]');
        // console.log(this.indices_[beginIndex + j]);
      }
      ysBuffer.set(1, i, this.indices_[beginIndex + this.sampleLen_]);
      // console.log('this.indices_[beginIndex + this.sampleLen_]');
      // console.log(this.indices_[beginIndex + this.sampleLen_]);
      // console.log('this.examplePosition_ +1');
      // console.log(this.examplePosition_);
      this.examplePosition_++;
    }
    return [xsBuffer.toTensor(), ysBuffer.toTensor()];
  }

  /**
   * Get the unique character at given index from the character set.
   *
   * @param {number} index
   * @returns {string} The unique character at `index` of the character set.
   */
  getFromCharSet(index) {
    return this.charSet_[index];
  }

  /**
   * Convert text string to integer indices.
   *
   * @param {string} text Input text.
   * @returns {number[]} Indices of the characters of `text`.
   */
  textToIndices(text) {
    const indices = [];
    for (let i = 0; i < text.length; ++i) {
      indices.push(this.charSet_.indexOf(text[i]));
    }
    return indices;
  }

  /**
   * Get a random slice of text data.
   *
   * @returns {[string, number[]} The string and index representation of the
   *   same slice. GET FIRST SLICE
   */
  getRandomSlice() {
    const startIndex = Math.round(
      Math.random() * (this.textLen_ - this.sampleLen_ - 1)
    );
    // const startIndex = 0;
    // const textSlice = this.slice_(
    //   startIndex,
    //   startIndex + this.sampleLen_ + 50
    // );
    const textSlice = this.slice_(startIndex, startIndex + this.sampleLen_);
    return [textSlice, this.textToIndices(textSlice)];
  }

  /**
   * Get a slice of the training text data.
   *
   * @param {number} startIndex
   * @param {number} endIndex
   * @param {bool} useIndices Whether to return the indices instead of string.
   * @returns {string | Uint16Array} The result of the slicing.
   */
  slice_(startIndex, endIndex) {
    return this.textString_.slice(startIndex, endIndex);
  }

  /**
   * Get the set of unique characters from text.
   */
  getCharSet_() {
    this.charSet_ = [];
    for (let i = 0; i < this.textLen_; ++i) {
      if (this.charSet_.indexOf(this.textString_[i]) === -1) {
        this.charSet_.push(this.textString_[i]);
      }
    }
    this.charSetSize_ = this.charSet_.length;
  }

  /**
   * Convert all training text to integer indices.
   */
  convertAllTextToIndices_() {
    this.indices_ = new Uint16Array(this.textToIndices(this.textString_));
  }

  /**
   * Generate the example-begin indices; shuffle them randomly.
   */
  generateExampleBeginIndices_() {
    // Prepare beginning indices of examples.
    this.exampleBeginIndices_ = [];
    for (
      let i = 0;
      i < this.textLen_ - this.sampleLen_ - 1;
      i += this.sampleStep_
    ) {
      this.exampleBeginIndices_.push(i);
    }
    console.log('exampleBeginIndices_');
    console.log(this.exampleBeginIndices_);

    // Randomly shuffle the beginning indices.
    // tf.util.shuffle(this.exampleBeginIndices_);
    this.examplePosition_ = 0;
  }
}

/**
 * Create a model for next-character prediction.
 * @param {number} sampleLen Sampling length: how many characters form the
 *   input to the model.
 * @param {number} charSetSize Size of the character size: how many unique
 *   characters there are.
 * @param {number|numbre[]} lstmLayerSizes Size(s) of the LSTM layers.
 * @return {tf.Model} A next-character prediction model with an input shape
 *   of `[null, sampleLen, charSetSize]` and an output shape of
 *   `[null, charSetSize]`.
 */
export function createModel(sampleLen, charSetSize, lstmLayerSizes) {
  const model = tf.sequential();
  model.add(
    tf.layers.lstm({
      units: lstmLayerSizes,
      // returnSequences: true,
      activation: 'selu',

      inputShape: [sampleLen, charSetSize],
    })
  );

  model.add(tf.layers.dense({ units: charSetSize, activation: 'sigmoid' }));

  return model;
}

export function compileModel(model) {
  // const optimizer = tf.train.rmsprop(learningRate);
  const optimizer = tf.train.adam();
  // const optimizer = tf.train.adamax();
  // const optimizer = tf.train.adadelta();
  // model.compile({ optimizer: optimizer, loss: 'categoricalCrossentropy' });
  // model.compile({ optimizer: optimizer, loss: 'cosineProximity' });
  model.compile({
    optimizer: optimizer,
    // loss: 'meanAbsolutePercentageError',
    // loss: 'meanAbsoluteError',
    // loss: 'categoricalHinge',
    loss: 'categoricalCrossentropy',
    // metrics: 'accuracy',
    // metrics: 'accuracy',

    // metrics: 'categoricalAccuracy',
  });

  model.summary();
}

/**
 * Train model.
 * @param {tf.Model} model The next-char prediction model, assumed to have an
 *   input shape of `[null, sampleLen, charSetSize]` and an output shape of
 *   `[null, charSetSize]`.
 * @param {TextData} textData The TextData object to use during training.
 * @param {number} numEpochs Number of training epochs.
 * @param {number} examplesPerEpoch Number of examples to draw from the
 *   `textData` object per epoch.
 * @param {number} batchSize Batch size for training.
 * @param {number} validationSplit Validation split for training.
 * @param {tf.CustomCallbackArgs} callbacks Custom callbacks to use during
 *   `model.fit()` calls.
 */
export async function fitModel(
  model,
  textData,
  batchSize,
  validationSplit,
  ModelName
) {
  //Guardar

  // for (let i = 0; i < numEpochs; ++i) {

  let dirFileTxt2 = `src/models/${ModelName}/${ModelName}ConfigsParams.txt`;
  let now = new Date();
  fs.writeFile(
    dirFileTxt2,
    `ModelName: ${ModelName}
  batchSizeConf: ${batchSizeConf}
  sampleLen: ${sampleLen}
  sampleStep: ${sampleStep}
  displayLengthConf: ${displayLengthConf}
  validationSplitConf: ${validationSplitConf}
  Fecha: ${now}
  Notas: ${NotasDeBitacora}`,
    function () {
      console.log('Params Guardados Correctamente');
    }
  );
  let xs;
  let ys;
  for (let i = 0; i < 110; i++) {
    if (
      i === 0 // ||
      // i === 10 ||
      // i === 20 ||
      // i === 30 ||
      // i === 40 ||
      // i === 50 ||
      // i === 60 ||
      // i === 70 ||
      // i === 80 ||
      // i === 90 ||
      // i === 100
    ) {
      [xs, ys] = textData.nextDataEpoch();
      console.log(textData.nextDataEpoch());
      console.log('+ creado nuevo set de datos');
    }
    if (xs !== undefined && ys !== undefined) {
      console.log('+ preparandose para iniciar entrenamiento');
      await model.fit(xs, ys, {
        epochs: 1,
        batchSize: batchSize,
        validationSplit,
      });
    }

    // if (
    //   i === 9 ||
    //   i === 19 ||
    //   i === 29 ||
    //   i === 39 ||
    //   i === 49 ||
    //   i === 59 ||
    //   i === 69 ||
    //   i === 79 ||
    //   i === 89 ||
    //   i === 99
    // ) {
    //   xs.dispose();
    //   console.log('tensores Vaciados');
    //   ys.dispose();
    //   console.log('ELIMINANDO SET ANTIGUO DE DATOS!!!!!');
    // }

    //MOMENTANEAMENTE PONGO LAS EPOCAS AQUI MANUAL

    console.log(`+ Iniciando guardado de modelo`);
    await model.save(`file://${__dirname}/../models/${ModelName}`);
    console.log(`+ modelo: ${ModelName} guardado correctamente`);
    let dirFileTxt = `src/models/${ModelName}/${ModelName}.txt`;

    fs.access(dirFileTxt, (err) => {
      if (err) {
        fs.writeFile(dirFileTxt, `${1}`, function () {
          console.log('+ contador inicializado y guardado correctamente');
        });
      } else {
        // console.log('The file exists.');
        fs.readFile(dirFileTxt, 'utf8', function (err, data) {
          if (err) {
            return console.log(err);
          }
          let importedEpochCount = parseInt(data);
          let newEpochCounter = importedEpochCount + 1;
          fs.writeFile(dirFileTxt, `${newEpochCounter}`, function () {
            console.log('+ epoca total actualizada');
            console.log(newEpochCounter);
            console.log('+ -----------------------');
          });
        });
      }
    });
  }
}

/**
 * Generate text using a next-char-prediction model.
 *
 * @param {tf.Model} model The model object to be used for the text generation,
 *   assumed to have input shape `[null, sampleLen, charSetSize]` and output
 *   shape `[null, charSetSize]`.
 * @param {number[]} sentenceIndices The character indices in the seed sentence.
 * @param {number} length Length of the sentence to generate.
 * @param {number} temperature Temperature value. Must be a number >= 0 and
 *   <= 1.
 * @param {(char: string) => Promise<void>} onTextGenerationChar An optinoal
 *   callback to be invoked each time a character is generated.
 * @returns {string} The generated sentence.
 */
export async function generateText(
  inputSentence,
  model,
  textData,
  sentenceIndices,
  length,
  temperature,
  onTextGenerationChar
) {
  const sampleLen = model.inputs[0].shape[1];
  const charSetSize = model.inputs[0].shape[2];

  // Avoid overwriting the original input.
  sentenceIndices = sentenceIndices.slice();

  let generated = inputSentence;
  while (generated.length < length) {
    // Encode the current input sequence as a one-hot Tensor.
    const inputBuffer = new tf.TensorBuffer([1, sampleLen, charSetSize]);

    // Make the one-hot encoding of the seeding sentence.
    for (let i = 0; i < sampleLen; ++i) {
      inputBuffer.set(1, 0, i, sentenceIndices[i]);
    }
    const input = inputBuffer.toTensor();

    // Call model.predict() to get the probability values of the next
    // character.
    const output = model.predict(input);
    // console.log('output');
    // console.log(output);
    // Sample randomly based on the probability values.
    // const winnerIndex = tf.squeeze(output);
    // const winnerIndex = sample(output, temperature);
    const winnerIndex = sample(tf.squeeze(output), temperature);
    // console.log('winnerIndex');
    // console.log(winnerIndex);
    const winnerChar = textData.getFromCharSet(winnerIndex);
    // console.log(winnerChar);
    // if (onTextGenerationChar != null) {
    //   await onTextGenerationChar(winnerChar);
    // }
    //  else {
    //   console.log('ERROR NO SE PUDO OBTENER CARACTER');
    // }
    // console.log(':');
    generated += winnerChar;
    sentenceIndices = sentenceIndices.slice(1);
    sentenceIndices.push(winnerIndex);

    // Memory cleanups.
    input.dispose();
    output.dispose();
  }
  return generated;
}

/**
 * Draw a sample based on probabilities.
 *
 * @param {tf.Tensor} probs Predicted probability scores, as a 1D `tf.Tensor` of
 *   shape `[charSetSize]`.
 * @param {tf.Tensor} temperature Temperature (i.e., a measure of randomness
 *   or diversity) to use during sampling. Number be a number > 0, as a Scalar
 *   `tf.Tensor`.
 * @returns {number} The 0-based index for the randomly-drawn sample, in the
 *   range of `[0, charSetSize - 1]`.
 */
export function sample(probs, temperature) {
  return tf.tidy(() => {
    // probar con solo probs
    // const logits = tf.log(probs);
    // const logits = tf.div(tf.log(probs), 0.75);
    const logits = tf.div(tf.log(probs), Math.max(temperature, 1e-6));
    // console.log('probs');
    // console.log(probs);
    // const logits = probs;
    // console.log('logits');
    // console.log(logits);
    // console.log();
    // const isNormalized = true;
    // `logits` is for a multinomial distribution, scaled by the temperature.
    // We randomly draw a sample from the distribution.
    // return tf.multinomial(logits, 3); //.dataSync()[0];
    // return tf.multinomial(logits, 1).dataSync()[0];

    function mostOccurringElement(array) {
      var max = array[0],
        counter = {},
        i = array.length,
        element;

      while (i--) {
        element = array[i];
        if (!counter[element]) counter[element] = 0;
        counter[element]++;
        if (counter[max] < counter[element]) max = element;
      }
      return max;
    }

    const TimesToCheck = 1000;
    let probsSample = tf.multinomial(logits, TimesToCheck).dataSync();

    let result = mostOccurringElement(probsSample);
    // console.log(result);
    return result;
    // return tf.multinomial(logits, 10000).dataSync()[0];
    // return tf.multinomial(logits, 1, null, isNormalized).dataSync()[0];
  });
}
