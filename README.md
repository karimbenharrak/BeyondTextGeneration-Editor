# Beyond Text Generation: Supporting Writers with Continuous Automatic Text Summaries

This repository contains the code for the system described in the paper [Beyond Text Generation: Supporting Writers with Continuous Automatic Text Summaries](https://dl.acm.org/doi/abs/10.1145/3526113.3545672) by Hai Dang, Karim Benharrak, Florian Lehmann, and Daniel Buschek. The system is designed to automatically generate continuous text summaries of a given document in real-time, as the user writes.

## Getting Started

### Backend

All code instruction should be executed in ```./backend```

#### Prerequisites

To run the backend, you will need to have some Python packages installed.

You can install these dependencies by running the following command:

```
pip install -r requirements.txt
```

Also you need to download the following file and copy it into the backend folder:

[glove.6B.100d.txt](https://www.kaggle.com/datasets/danielwillgeorge/glove6b100dtxt)

#### Running the backend

To run the backend, simply use the following command in the backend folder:

```
python flask_basic_app.py
```

### Frontend

All code instruction should be executed in ```./frontend```

#### Prerequisites

To run the frontend, you will need to have some npm packages installed.

You can install these dependencies by running the following command:

```
npm install
```

#### Running the frontend

To run the backend, simply use the following command in the frontend folder:

```
npm start
```

### Using the System

The system can now be accessed on the following address:
```
http://localhost:3000/
```

To use the system, you will need to start writing on your document. You can the interact with the sidebar and the system will then generate a continuous summary of each paragraphs as you write.

An example of how to use the system is also provided in the research paper.

### Additional Resources

The paper "Beyond Text Generation: Supporting Writers with Continuous Automatic Text Summaries" provides a detailed description of the system and its performance.

### Contributions

We welcome contributions to this project. If you would like to contribute, please fork the repository and submit a pull request.

### License

This project is licensed under the MIT License - see the LICENSE file for details.

### Contact

If you have any questions or issues, please contact the authors of the paper or create an issue in the repository.

