FROM nvcr.io/nvidia/pytorch:21.07-py3

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt
RUN python -m spacy download en_core_web_sm
CMD ["gunicorn", "wsgi:app"]
