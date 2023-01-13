import time
from datetime import datetime
import os
import nltk
import numpy as np
import pandas as pd

from flask import Flask, jsonify, request
from flask_cors import CORS

import torch
from transformers import T5Tokenizer, T5ForConditionalGeneration

from wordwise import Extractor

import logging

import ssl

logger = logging.getLogger(__file__)

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

if os.environ.get('DEBUG', False):
    logger.debug("Preprocess glove data ...")

with open('glove.6B.100d.txt', encoding='utf-8') as f:
    # Extract word vectors
    word_embeddings = {}
    
    for line in f:
        values = line.split()
        word = values[0]
        coefs = np.asarray(values[1:], dtype='float32')
        word_embeddings[word] = coefs

if os.environ.get('DEBUG', False):
    logger.debug("Finished processing glove data!")


if os.environ.get('DEBUG', False):
    logger.debug("Loading NLTK data")

try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

nltk.download('punkt')
nltk.download('stopwords')

@app.route('/summarize-all', methods=['GET', 'POST'])
def summarizeAll():
    if(request.method == 'POST'):
        some_json = request.get_json()

        sentence_count = 4
        if(some_json['zoom'] == 0):
            sentence_count = 4
        elif (some_json['zoom'] == 1):
            sentence_count = 3
        elif (some_json['zoom'] == 2):
            sentence_count = 2
        elif (some_json['zoom'] == 3):
            sentence_count = 1

        resultArray = {}

        # function to remove stopwords
        def remove_stopwords(sen):
            sen_new = " ".join([i for i in sen if i not in stop_words])
            return sen_new

        for par in range(0, len(some_json['eingabe'])):

            if(some_json['eingabe'][par]['tag'] == "edited" or some_json['eingabe'][par]['tag'] == "updated"):

                print(par)

                sentences = []
                sentences.append(nltk.sent_tokenize(some_json['eingabe'][par]['paragraph']))

                sentences = [y for x in sentences for y in x]  # flatten list

                ls = [type(item) for item in sentences]
                print(ls)

                # remove punctuations, numbers and special characters
                clean_sentences = pd.Series(sentences).str.replace("[^a-zA-Z]", " ")

                # make alphabets lowercase
                clean_sentences = [s.lower() for s in clean_sentences]

                from nltk.corpus import stopwords
                stop_words = stopwords.words('english')

                # remove stopwords from the sentences
                clean_sentences = [remove_stopwords(r.split()) for r in clean_sentences]

                sentence_vectors = []
                for i in clean_sentences:
                    if len(i) != 0:
                        v = sum([word_embeddings.get(w, np.zeros((100,))) for w in i.split()]) / (len(i.split()) + 0.001)
                    else:
                        v = np.zeros((100,))
                    sentence_vectors.append(v)

                # similarity matrix
                sim_mat = np.zeros([len(sentences), len(sentences)])

                from sklearn.metrics.pairwise import cosine_similarity

                for i in range(len(sentences)):
                    for j in range(len(sentences)):
                        if i != j:
                            sim_mat[i][j] = \
                                cosine_similarity(sentence_vectors[i].reshape(1, 100), sentence_vectors[j].reshape(1, 100))[
                                    0, 0]

                print(sim_mat)

                import networkx as nx

                nx_graph = nx.from_numpy_array(sim_mat)
                scores = nx.pagerank(nx_graph)

                ranked_sentences = sorted(((scores[i], s) for i, s in enumerate(sentences)), reverse=True)

                ranked_sentences_test = list(((scores[i], s) for i, s in enumerate(sentences)))

                final_sentences = []

                for sentence in ranked_sentences_test:
                    if sentence in ranked_sentences[:sentence_count]:
                        final_sentences.append(sentence[1])


                final_par = ""

                for sentence in final_sentences:
                    final_par += sentence + " "
                resultArray[par] = final_par

        return jsonify({'you sent': format(some_json)}, {'highFrequencies': []}, {'resultArray': resultArray}), 201

if os.environ.get('DEBUG', False):
    logger.debug("Loading T5 model")

device = torch.device('cpu')
model = T5ForConditionalGeneration.from_pretrained('t5-base')
tokenizer = T5Tokenizer.from_pretrained('t5-base')

time.sleep(5)

@app.route('/summarize-abstractive', methods=['GET', 'POST'])
def summarizeAbstractive():
    if(request.method == 'POST'):
        some_json = request.get_json()
        resultArray = {}

        prevTime = datetime.now()

        for par in range(0, len(some_json['eingabe'])):
            if(some_json['eingabe'][par]['tag'] == "edited" or some_json['eingabe'][par]['tag'] == "updated"):
                text = some_json['eingabe'][par]['paragraph']

                preprocess_text = text.strip().replace("\n", "")
                t5_prepared_Text = "summarize: " + preprocess_text

                tokenized_text = tokenizer.encode(t5_prepared_Text, return_tensors="pt").to(device)

                # summmarize
                summary_ids = model.generate(tokenized_text,
                                             min_length=30,
                                             max_length=100
                                            )
                output = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

                resultArray[par] = output
        print(resultArray)
        print("Duration:", datetime.now() - prevTime)

        return jsonify({'you sent': format(some_json)}, {'highFrequencies': []}, {'resultArray': resultArray}), 201

@app.route('/summarize-abstractive-new', methods=['GET', 'POST'])
def summarizeAbstractiveNew():
    if(request.method == 'POST'):
        some_json = request.get_json()
        resultArray = {}
        multiplier = some_json['multiplier']

        prevTime = datetime.now()

        for par in range(0, len(some_json['eingabe'])):
            text = some_json['eingabe'][par]['paragraph']

            preprocess_text = text.strip().replace("\n", "")
            t5_prepared_Text = "summarize: " + preprocess_text

            tokenized_text = tokenizer.encode(t5_prepared_Text, return_tensors="pt").to(device)

            # summmarize
            summary_ids = model.generate(tokenized_text,
                                        num_beams=4,
                                        no_repeat_ngram_size=2,
                                        #min_length=int((tokenized_text.size(dim=1) * multiplier) - 0.1 * (tokenized_text.size(dim=1) * multiplier)),
                                        max_length=int(tokenized_text.size(dim=1) * multiplier),
                                        early_stopping=True
                                        )
            output = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

            resultArray[par] = output #'. '.join(output.capitalize() for x in output.split('. '))

        return jsonify({'you sent': format(some_json)}, {'highFrequencies': []}, {'resultArray': resultArray}), 201

@app.route('/summarize-one-sentence', methods=['GET', 'POST'])
def summarizeOneSentence():
    if(request.method == 'POST'):
        some_json = request.get_json()
        sentence_count = 1

        resultArray = {}

        # function to remove stopwords
        def remove_stopwords(sen):
            sen_new = " ".join([i for i in sen if i not in stop_words])
            return sen_new

        prevTime = datetime.now()

        for par in range(0, len(some_json['eingabe'])):

            sentences = []
            sentences.append(nltk.sent_tokenize(some_json['eingabe'][par]['paragraph']))

            sentences = [y for x in sentences for y in x]  # flatten list

            # remove punctuations, numbers and special characters
            clean_sentences = pd.Series(sentences).str.replace("[^a-zA-Z]", " ")

            # make alphabets lowercase
            clean_sentences = [s.lower() for s in clean_sentences]

            from nltk.corpus import stopwords
            stop_words = stopwords.words('english')

            # remove stopwords from the sentences
            clean_sentences = [remove_stopwords(r.split()) for r in clean_sentences]

            sentence_vectors = []
            for i in clean_sentences:
                if len(i) != 0:
                    v = sum([word_embeddings.get(w, np.zeros((100,))) for w in i.split()]) / (len(i.split()) + 0.001)
                else:
                    v = np.zeros((100,))
                sentence_vectors.append(v)

            # similarity matrix
            sim_mat = np.zeros([len(sentences), len(sentences)])

            from sklearn.metrics.pairwise import cosine_similarity

            for i in range(len(sentences)):
                for j in range(len(sentences)):
                    if i != j:
                        sim_mat[i][j] = \
                            cosine_similarity(sentence_vectors[i].reshape(1, 100), sentence_vectors[j].reshape(1, 100))[
                                0, 0]

            import networkx as nx

            nx_graph = nx.from_numpy_array(sim_mat)
            scores = nx.pagerank(nx_graph)

            ranked_sentences = sorted(((scores[i], s) for i, s in enumerate(sentences)), reverse=True)

            ranked_sentences_test = list(((scores[i], s) for i, s in enumerate(sentences)))

            final_sentences = []

            for sentence in ranked_sentences_test:
                if sentence in ranked_sentences[:sentence_count]:
                    final_sentences.append(sentence[1])

            final_par = ""

            for sentence in final_sentences:
                final_par += sentence + " "
            resultArray[par] = final_par

        return jsonify({'you sent': format(some_json)}, {'highFrequencies': []}, {'resultArray': resultArray}), 201


extractor = Extractor()

@app.route('/summarize-keywords', methods=['GET', 'POST'])
def keywordSummarize():
    if (request.method == 'POST'):
        some_json = request.get_json()

        allKeywords = []

        for par in range(0, len(some_json['eingabe'])):
            word_list = some_json['eingabe'][par]['paragraph'].split()
            keywords = []
            if(len(word_list) > 5):
                try:
                    keywords = extractor.generate(some_json['eingabe'][par]['paragraph'])
                except BaseException:
                    keywords = word_list[:5]
            else:
                if(len(word_list) == 0):
                    keywords[0] = ""
                else:
                    keywords = word_list
            allKeywords.append(keywords)

        return jsonify({'you sent': format(some_json)}, {'keywords': allKeywords}), 201

@app.route('/merge-summarize', methods=['GET', 'POST'])
def mergeSummarize():
    if (request.method == 'POST'):
        some_json = request.get_json()
        sentence_count = 5

        resultArray = {}

        # function to remove stopwords
        def remove_stopwords(sen):
            sen_new = " ".join([i for i in sen if i not in stop_words])
            return sen_new

        prevTime = datetime.now()

        sentences1 = []
        sentences1.append(nltk.sent_tokenize(some_json['paragraph1'][0]))

        sentences2 = []
        sentences2.append(nltk.sent_tokenize(some_json['paragraph2'][0]))

        sentences1 = [y for x in sentences1 for y in x]  # flatten list
        sentences2 = [y for x in sentences2 for y in x]  # flatten list

        sentences = sentences1 + sentences2

        ls = [type(item) for item in sentences]

        # remove punctuations, numbers and special characters
        clean_sentences = pd.Series(sentences).str.replace("[^a-zA-Z]", " ")

        # make alphabets lowercase
        clean_sentences = [s.lower() for s in clean_sentences]

        from nltk.corpus import stopwords
        stop_words = stopwords.words('english')

        # remove stopwords from the sentences
        clean_sentences = [remove_stopwords(r.split()) for r in clean_sentences]

        sentence_vectors = []
        for i in clean_sentences:
            if len(i) != 0:
                v = sum([word_embeddings.get(w, np.zeros((100,))) for w in i.split()]) / (
                            len(i.split()) + 0.001)
            else:
                v = np.zeros((100,))
            sentence_vectors.append(v)

        # similarity matrix
        sim_mat = np.zeros([len(sentences), len(sentences)])

        from sklearn.metrics.pairwise import cosine_similarity

        for i in range(len(sentences)):
            for j in range(len(sentences)):
                if i != j:
                    sim_mat[i][j] = \
                        cosine_similarity(sentence_vectors[i].reshape(1, 100),
                                          sentence_vectors[j].reshape(1, 100))[0, 0]

        import networkx as nx

        nx_graph = nx.from_numpy_array(sim_mat)
        scores = nx.pagerank(nx_graph)

        ranked_sentences = sorted(((scores[i], s, i) for i, s in enumerate(sentences)), reverse=True)

        ranked_sentences_test = list(((scores[i], s, i) for i, s in enumerate(sentences)))
        takenIndices = []
        final_par = ""
        for sentence in ranked_sentences_test:
                if sentence in ranked_sentences[:sentence_count]:
                    final_par += sentence[1] + " "
                    takenIndices.append(sentence[2])
        resultArray[0] = final_par

        return jsonify({'you sent': format(some_json)}, {'takenIndices': takenIndices}, {'sentences1': sentences1, 'sentences2': sentences2}, {'resultArray': resultArray}, {'par1Length': len(sentences1), 'par2Length': len(sentences2)}), 201

@app.route('/merge-abstractive', methods=['GET', 'POST'])
def mergeAbstractive():
    if (request.method == 'POST'):
        some_json = request.get_json()
        resultArray = {}
        multiplier = some_json['multiplier']

        prevTime = datetime.now()

        for par in range(0, len(some_json['eingabe'])):
            text = some_json['eingabe'][par]

            preprocess_text = text.strip().replace("\n", "")
            t5_prepared_Text = "summarize: " + preprocess_text

            tokenized_text = tokenizer.encode(t5_prepared_Text, return_tensors="pt").to(device)

            # summmarize
            summary_ids = model.generate(tokenized_text,
                                         num_beams=4,
                                         no_repeat_ngram_size=2,
                                         min_length=int((tokenized_text.size(dim=1) * multiplier) - 0.5 * (
                                                     tokenized_text.size(dim=1) * multiplier)),
                                         max_length=int((tokenized_text.size(dim=1) * multiplier) + 0.5 * (
                                                     tokenized_text.size(dim=1) * multiplier)),
                                            early_stopping=True,
                                            repetition_penalty=1.2,
                                         )
            output = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

            resultArray[par] = '. '.join(output.capitalize() for x in output.split('. '))

        return jsonify({'you sent': format(some_json)}, {'highFrequencies': []}, {'resultArray': resultArray}), 201


if __name__ == '__main__':
    app.run(debug=True)
