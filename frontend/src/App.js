import './App.css';
import React from 'react';
import $ from 'jquery';

import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col } from 'react-bootstrap';
import { Button as BButton } from "react-bootstrap";

import { Trash, CheckLg } from "react-bootstrap-icons";

import ClipLoader from "react-spinners/ClipLoader";

import Card from '@material-ui/core/Card';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import { CKEditor } from '@ckeditor/ckeditor5-react';

// NOTE: Use the editor from source (not a build)!
import BalloonEditor from '@ckeditor/ckeditor5-editor-balloon/src/ballooneditor';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';

import Topbar from "./components/Topbar/Topbar";

const editorConfiguration = {
  plugins: [Essentials, Paragraph],
  toolbar: []
};

const prototypeConfig = {
  initialDocumentText: "",
  documentName: "BeyondTextGeneration-Editor",
  documentDescription: "The Sidebar can support you with summarizing, reordering, and merging paragraphs.",
};

function App() {

  const testRef = React.useRef(null);

  const [cardText, setCardText] = React.useState([]);

  const [mergeActiveState, setMergeActiveState] = React.useState(false);

  const [draggableDisabledState, setDraggableDisabledState] = React.useState(false);

  const [editor, setEditor] = React.useState(null);

  const [statusAction, setStatusAction] = React.useState(null);

  const handleClose = (index) => {
    var cardTextCopy = [];
    var mergeCardStateCopy = mergeCardState;

    for (var i = 0; i < cache[zoomFactor].length; i++) {
      cardTextCopy[i] = cache[zoomFactor][i].paragraph;
      mergeCardState[i] = false;
    }

    setCardText([...cardTextCopy]);
    setMergeCardState([...mergeCardStateCopy]);

    setMergeActiveState(false);
    setDraggableDisabledState(false);

    jumpTo(index);
  };

  const handleDelete = (index) => {
    var c_cache = JSON.parse(JSON.stringify(cache));

    var newText = "";

    for (var i = 0; i < c_cache[0].length; i++) {
      if (i != index) {
        newText = newText + "<div>" + c_cache[0][i].paragraph + "</div>";
      }
    }

    var cardTextCopy = cardText;
    for(var i = index; i < cardTextCopy.length; i++){
      if(i < cardTextCopy.length - 1) cardTextCopy[i] = cardTextCopy[i + 1];
      else delete cardTextCopy[i];
    }
    setCardText([...cardTextCopy]);

    setHtml(newText);
  };

  const handleToText = (index) => {
    var c_cache = JSON.parse(JSON.stringify(cache));

    c_cache[0][index].paragraph = "" + c_cache[zoomFactor][index].paragraph;

    var newText = "";

    for (var i = 0; i < c_cache[0].length; i++) {
      newText = newText + "<div>" + c_cache[0][i].paragraph + "</div>";
    }

    setCache(c_cache);
    setHtml(newText);
  };

  document.body.style = 'background: white;';

  const [html, setHtml] = React.useState(prototypeConfig.initialDocumentText);
  const [mergehtml, setMergehtml] = React.useState("");
  const [zoomFactor, setZoomFactor] = React.useState(0);
  const [zoomFactorButton, setZoomFactorButton] = React.useState(0);
  const [items, setItems] = React.useState([
    { value: html },
    { value: html }
  ]);
  const [cache, setCache] = React.useState([
    [{ tag: "edited", paragraph: "" }],
    [],
    [],
    [],
    [],
    []
  ]);
  const [mergeCardState, setMergeCardState] = React.useState([]);
  const [mergeState, setMergeState] = React.useState([]);
  const [par1State, setPar1State] = React.useState([]);
  const [par2State, setPar2State] = React.useState([]);

  const [isLoading, setIsLoading] = React.useState(false);

  const useStyles = makeStyles((theme) => ({
    root: {
      minWidth: 275,
      marginLeft: 10,
      marginBottom: 10,
      height: "100%",
    },
    root2: {
      minWidth: 275,
      marginLeft: 10,
      marginBottom: 10,
      height: "100%",
      opacity: 0.5,
    },
    bullet: {
      display: 'inline-block',
      margin: '0 2px',
      transform: 'scale(0.8)',
    },
    title: {
      fontSize: 14,
    },
    pos: {
      marginBottom: 12,
    },
    controls: {
      display: 'flex',
      alignItems: 'center',
      paddingLeft: theme.spacing(1),
      paddingBottom: theme.spacing(1),
    },
    sidebar: {
      borderLeft: "1px solid gray",
    },
    notClickable: {
      pointerEvents: "none",
      //opacity: 0.8,
    },
    clickable: {

    },

  }));

  const classes = useStyles();

  var paragraphs = [];

  function makeParagraphs() {
    var test = html.match(/<p>(.*?)<\/p>/g).map(function (val) {
      return val.replace(/<\/?p>/g, '');
    });
    /*
    test = test.replaceAll("</div>", "");
    test = test.replaceAll(/<.*?>/g, "");
    test = test.split("/n");
    */

    var testy = [];

    test.map(function (par) {
      testy.push({
        tag: "edited",
        paragraph: par,
      });
    });

    var c_cache = cache;

    for (var i = 0; i < test.length; i++) {
      if (c_cache[0][i] !== undefined && c_cache[0][i].paragraph.localeCompare(testy[i].paragraph) === 0) {
        c_cache[0][i].tag = "updated";
      } else {
        c_cache[0][i] = { tag: "edited", paragraph: testy[i].paragraph }
      }
    }

    setCache(c_cache);

    return testy;
  }

  function zoomIn() {

    if (zoomFactor == 5) return;

    paragraphs = makeParagraphs()

    var pars = [];

    for (var i = 0; i < paragraphs.length; i++) {
      if (cache[zoomFactor + 1][i].tag.localeCompare("edited") === 0 || cache[zoomFactor + 1][i] === undefined) {
        pars.push(cache[0][i]);
      }
    }

    var obj = {
      eingabe: pars,
      zoom: zoomFactor
    };

    var url = "";

    if (zoomFactor < 4) {
      url = "http://127.0.0.1:5000/summarize-all";
    } else if (zoomFactor == 4) {
      url = "http://127.0.0.1:5000/summarize-abstractive";
    }

    fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(obj)
    }).then((response) => {
      return response.json();
    }).then((data) => {
      return Object.values(data[2].resultArray);
    }).then((resultArray) => {

      var sum_2 = JSON.parse(JSON.stringify(cache));
      var j = 0
      for (var i = 0; i < paragraphs.length; i++) {
        if (sum_2[zoomFactor + 1][i].tag.localeCompare("edited") === 0 || sum_2[zoomFactor + 1][i] === undefined) {
          sum_2[zoomFactor + 1][i] = { tag: "updated", paragraph: resultArray[j] };
          j++;
        }

      }

      var cardTextCopy = []
      for (var i = 0; i < paragraphs.length; i++) {
        cardTextCopy[i] = sum_2[zoomFactor + 1][i].paragraph;
      }
      setCardText([...cardTextCopy]);

      setCache(sum_2);

      setZoomFactor(zoomFactor + 1);

    })
  }

  const delay = ms => new Promise(res => setTimeout(res, ms));

  async function jumpTo(divId) {
    //$(".ck-content").children()[divId].scrollIntoView();
    // Scroll to the center
    $(".ck-content").scrollTop($(".ck-content").scrollTop() + $(".ck-content").children().eq(divId).position().top - $(".ck-content").height() / 2 + $(".ck-content").children().eq(divId).height() / 2);
    $(".ck-content").children().eq(divId).css('background-color', '#c0ffc8');
    await delay(1000);
    $(".ck-content").children().eq(divId).css('background-color', '');
  }

  function zoomOut() {
    if (zoomFactor == 0) return;
    if (zoomFactor === 1) {
      paragraphs = makeParagraphs()
      var cardTextCopy = cardText;
      for (var i = 0; i < cache[0].length; i++) {
        cardTextCopy[i] = cache[0][i].paragraph;
      }
      setCardText([...cardTextCopy]);
      setZoomFactor(zoomFactor - 1);
    }
    else {
      paragraphs = makeParagraphs()

      var obj = {
        eingabe: paragraphs,
        zoom: zoomFactor - 2
      };

      fetch("http://127.0.0.1:5000/summarize-all", {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(obj)
      }).then((response) => {
        return response.json();
      }).then((data) => {
        return Object.values(data[2].resultArray);
      }).then((resultArray) => {

        var sum_2 = JSON.parse(JSON.stringify(cache));
        var j = 0

        for (var i = 0; i < cache[0].length; i++) {
          sum_2[zoomFactor - 1][i] = { tag: "updated", paragraph: resultArray[j] };
          sum_2[0][i].tag = "updated";
          j++;
        }

        var cardTextCopy = cardText;

        for (var i = 0; i < sum_2[zoomFactor - 1].length; i++) {
          cardTextCopy[i] = sum_2[zoomFactor - 1][i].paragraph;
        }

        setCardText([...cardTextCopy]);

        setCache(sum_2);
        setZoomFactor(zoomFactor - 1);
      })
    }
  }

  function mergeSummarize(par1, par2) {
    var paragraph1 = [];
    paragraph1.push(cache[0][par1].paragraph);
    var paragraph2 = [];
    paragraph2.push(cache[0][par2].paragraph);

    var obj = {
      paragraph1: paragraph1,
      paragraph2: paragraph2,
      zoom: 0,
    };

    fetch("http://127.0.0.1:5000/merge-summarize", {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(obj)
    }).then((response) => {
      return response.json();
    }).then((data) => {
      var indices = Object.values(data[1].takenIndices);
      var sentences1 = Object.values(data[2].sentences1);
      var sentences2 = Object.values(data[2].sentences2);
      var par1Length = data[4].par1Length;
      var par2Length = data[4].par2Length;
      var resultArray = [""];
      if(parseInt(par1) < parseInt(par2)){
        for(let i = 0; i < indices.length; i++){
          if(indices[i] < par1Length){
            resultArray[0] += "<span style=\"background-color: #aed6f1;\">" + sentences1[indices[i]] + "</span>";
          } else {
            resultArray[0] += "<span style=\"background-color: #F5CBA7;\">" + sentences2[indices[i] - par1Length] + "</span>";
          }
          if(i < indices.length - 1) resultArray[0] += " ";
        }
      } else {
        let firstPart = "";
        let secondPart = "";
        for(let i = 0; i < indices.length; i++){
          if(indices[i] < par1Length){
            secondPart += "<span style=\"background-color: #aed6f1;\">" + sentences1[indices[i]] + "</span>";
            if(i < indices.length - 1) secondPart += " ";
          } else {
            firstPart += "<span style=\"background-color: #F5CBA7;\">" + sentences2[indices[i] - par1Length] + "</span>";
            if(i < indices.length - 1) firstPart += " ";
          }
        }
        resultArray[0] = firstPart + " " + secondPart;
      }

      var newMergeHtml = "";
      var doc = new DOMParser().parseFromString("<div>" + html + "</div>", "text/xml");
      var children = doc.children[0].children;
      for(var i=0; i < children.length; i++){
        var child = children[i];
        if(i === parseInt(par1)){
          var newPar1 = "<p>";
          for(let j = 0; j < sentences1.length; j++){
            if(indices.includes(j)){
              newPar1 += "<span style=\"background-color: #aed6f1;\">" + sentences1[j] + "</span> ";
            } else {
              newPar1 += "<s>" + sentences1[j] + "</s>" + " ";
            }
          }
          newPar1 += "</p>";
          newMergeHtml += newPar1;
        } else if(i === parseInt(par2)){
          var newPar2 = "<p>"
          for(let j = 0; j < sentences2.length; j++){
            if(indices.includes(j + sentences1.length)){
              newPar2 += "<span style=\"background-color: #F5CBA7;\">" + sentences2[j] + "</span> ";
            } else {
              newPar2 += "<s>" + sentences2[j] + "</s>" + " ";
            }
          }
          newPar2 += "</p>";
          newMergeHtml += newPar2;
        } else {
          newMergeHtml += "<p>" + child.innerHTML + "</p>";
        }
        
      }
      setMergehtml(newMergeHtml);

      return resultArray;
    }).then((resultArray) => {
      var cardTextCopy = cardText.slice(0);
      var mergeCardStateCopy = mergeCardState;

      cardTextCopy[par1] = null;
      cardTextCopy[par2] = resultArray[0];
      var j = 0;
      for (var i = 0; i < cardTextCopy.length; i++) {
        if (cardTextCopy[i]) {
          cardTextCopy[j] = cardTextCopy[i];
          j++;
        }
      }
      cardTextCopy[cardTextCopy.length - 1] = null;

      for (var i = 0; i < cache[0].length; i++) {
        mergeCardStateCopy[i] = false;
      }
      if (par1 > par2) {
        mergeCardStateCopy[par2] = true;
      } else {
        mergeCardStateCopy[par2 - 1] = true;
      }

      setCardText([...cardTextCopy]);
      setMergeCardState([...mergeCardStateCopy]);

      setMergeState(resultArray[0]);

      setMergeActiveState(true);
      setDraggableDisabledState(true);

      return resultArray[0]
    })
  }

  async function handleOnDragEnd(result) {
    if (result.combine) {
      var mergedPar = await mergeSummarize(result.draggableId, result.combine.draggableId);
      setStatusAction("Merge View started!");
      clearTimeout(actionTimeout); actionTimeout = setTimeout(function() {
        setStatusAction(null);
      }, 8000);
      setPar2State(result.draggableId);
      setPar1State(result.combine.draggableId);
    }
    if (result.destination) {
      switchPar(result.source.index, result.destination.index);
      setStatusAction("Switched Paragraph " + (result.source.index + 1) + " with " + (result.destination.index + 1) + "!");
      clearTimeout(actionTimeout); actionTimeout = setTimeout(function() {
        setStatusAction(null);
      }, 8000);
      await delay(100);
      $(".ck-content").children().eq(result.destination.index).css('background-color', '#c0ffc8');
      $(".ck-content").children().eq(result.source.index).css('border-top', 'thick dotted #c0ffc8');
      await delay(3000);
      $(".ck-content").children().eq(result.destination.index).css('background-color', '');
      $(".ck-content").children().eq(result.source.index).css('border-top', '');
    }
  }

  function switchPar(par1, par2) {

    var c_cache = cache;

    var newText = "";

    let parOrigin = c_cache[0][par1].paragraph;

    for (var i = 0; i < c_cache.length; i++) {
      if (c_cache[i][par1] && c_cache[i][par2]) {
        var copy = c_cache[i][par1].paragraph;
        c_cache[i][par1].paragraph = c_cache[i][par2].paragraph;
        c_cache[i][par2].paragraph = copy;
      }
    }

    var cardTextCopy = cardText;

    for (var i = 0; i < c_cache[zoomFactor].length; i++) {
      cardTextCopy[i] = c_cache[zoomFactor][i].paragraph;
    }

    setCardText([...cardTextCopy]);

    for (var i = 0; i < c_cache[0].length; i++) {
      newText = newText + "<div>" + c_cache[0][i].paragraph + "</div>";
    }

    setCache(c_cache);
    setHtml(newText);
  }

  function merge(par1, par2) {

    var c_cache = JSON.parse(JSON.stringify(cache));

    var newText = "";

    c_cache[0][par1] = { tag: "edited", paragraph: mergeState.replace(/<\/?[^>]+(>|$)/g, "") };
    c_cache[0][par2] = null;
    for (var i = parseInt(par2); i < c_cache[0].length - 1; i++) {
      c_cache[0][i] = { tag: "edited", paragraph: c_cache[0][i + 1].paragraph };
    }
    for(let i = 0; i < c_cache.length; i++){
      c_cache[i].splice(c_cache[i].length - 1, 1);
    }

    var cardTextCopy = cardText;
    var mergeCardStateCopy = mergeCardState;

    for (var i = 0; i < c_cache[0].length; i++) {
      cardTextCopy[i] = c_cache[0][i].paragraph;
      mergeCardStateCopy[i] = false;
      c_cache[0][i].tag = "edited";
      c_cache[1][i].tag = "edited";
      c_cache[2][i].tag = "edited";
      c_cache[3][i].tag = "edited";
      c_cache[4][i].tag = "edited";
      c_cache[5][i].tag = "edited";
    }
    setMergeCardState([...mergeCardStateCopy]);


    for (var i = 0; i < c_cache[0].length; i++) {
      newText = newText + "<p>" + c_cache[0][i].paragraph + "</p>";
    }
    setHtml(newText);

    var pars = [];
    for (var i = 0; i < c_cache[0].length; i++) {
      pars.push(c_cache[0][i]);
    }

    setIsLoading(true);

    setTimeout(function() {
      if(par1 > par2){
        $(".ck-content").children().eq(par1 - 1).css('background-color', '#F5CBA7');
        $(".ck-content").children().eq(par2).css('border-top', 'thick dotted #aed6f1');
        setTimeout(function() {
          $(".ck-content").children().eq(par2).css('border-top', '');
          $(".ck-content").children().eq(par1 - 1).css('background-color', '');
          
        }, 2000);
      } else {
        $(".ck-content").children().eq(par1).css('background-color', '#F5CBA7');
        $(".ck-content").children().eq(par2 - 1).css('border-bottom', 'thick dotted #aed6f1');
        setTimeout(function() {
          $(".ck-content").children().eq(par2 - 1).css('border-bottom', '');
          $(".ck-content").children().eq(par1).css('background-color', '');
        }, 2000);
      }
    }, 100);

    if(zoomFactor === 0){
      for (var i = 0; i < cache[0].length; i++) {
        cardTextCopy[i] = cache[0][i].paragraph;
      }
      setCardText([...cardTextCopy]);
      setIsLoading(false);
      return;
    }
    
    var obj;
    var url = "";

    if(zoomFactor === 1){
      obj = {
        eingabe: pars,
      };

      url = "http://127.0.0.1:5000/summarize-one-sentence";
    } else if(zoomFactor === 2){
      obj = {
        eingabe: pars,
        multiplier: 0.7
      };

      url = "http://127.0.0.1:5000/summarize-abstractive-new";
    } else {
      obj = {
        eingabe: pars,
      };

      url = "http://127.0.0.1:5000/summarize-keywords";
    }

    fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(obj)
    }).then((response) => {
      return response.json();
    }).then((data) => {
      if(zoomFactor === 3) return Object.values(data[1].keywords);
      return Object.values(data[2].resultArray);
    }).then((resultArray) => {
      var j = 0
      for (var i = 0; i < c_cache[zoomFactor].length; i++) {
        if (c_cache[zoomFactor][i].tag.localeCompare("edited") === 0 || c_cache[zoomFactor][i] === undefined) {
          if(zoomFactor === 3){
            var str = "";
            for(let k = 0; k < resultArray[i].length; k++){
              str += resultArray[i][k]
              if(k < resultArray[i].length - 1) str += ", ";
            }
            c_cache[zoomFactor][i] = { tag: "updated", paragraph: str };
          } else {
            c_cache[zoomFactor][i] = { tag: "updated", paragraph: resultArray[j] };
          }
          j++;
        }

      }

      var cardTextCopy = []
      for (var i = 0; i < c_cache[zoomFactor].length; i++) {
        cardTextCopy[i] = c_cache[zoomFactor][i].paragraph;
      }
      
      setCardText([...cardTextCopy]);
      setCache([...c_cache]);
      setIsLoading(false);
    });
  }

  function zoomFunctionNew(method){
    
    setIsLoading(true);

    paragraphs = makeParagraphs()
    if(method === 0){
      var cardTextCopy = cardText;
      for (var i = 0; i < cache[0].length; i++) {
        cardTextCopy[i] = cache[0][i].paragraph;
      }
      setCardText([...cardTextCopy]);
      setZoomFactor(method);
      setIsLoading(false);
      return;
    }

    var pars = [];

    for (var i = 0; i < paragraphs.length; i++) {
      if (cache[method][i].tag.localeCompare("edited") === 0 || cache[method][i] === undefined) {
        pars.push(cache[0][i]);
      }
    }

    var obj;
    var url = "";

    if(method === 1){
      obj = {
        eingabe: pars,
      };

      url = "http://127.0.0.1:5000/summarize-one-sentence";
    } else if(method == 2){
      obj = {
        eingabe: pars,
        multiplier: 0.7
      };

      url = "http://127.0.0.1:5000/summarize-abstractive-new";
    } else {
      obj = {
        eingabe: pars,
      };

      url = "http://127.0.0.1:5000/summarize-keywords";
    }

    fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(obj)
    }).then((response) => {
      return response.json();
    }).then((data) => {
      if(method === 3) return Object.values(data[1].keywords);
      return Object.values(data[2].resultArray);
    }).then((resultArray) => {
      var c_cache = JSON.parse(JSON.stringify(cache));
      var j = 0
      for (var i = 0; i < c_cache[method].length; i++) {
        if (c_cache[method][i].tag.localeCompare("edited") === 0 || c_cache[method][i] === undefined) {
          if(method === 3){
            var str = "";
            for(let k = 0; k < resultArray[j].length; k++){
              str += resultArray[j][k]
              if(k < resultArray[j].length - 1) str += ", ";
            }
            c_cache[method][i] = { tag: "updated", paragraph: str };
          } else {
            c_cache[method][i] = { tag: "updated", paragraph: resultArray[j] };
          }
          j++;
        }

      }

      var cardTextCopy = []
      for (var i = 0; i < paragraphs.length; i++) {
        cardTextCopy[i] = c_cache[method][i].paragraph;
      }
      setCardText([...cardTextCopy]);
      setCache([...c_cache]);
      setZoomFactor(method);
      setIsLoading(false);
    })
  }

  function copyToClipboardFunction(TextToCopy) {
    var TempText = document.createElement("input");
    TempText.value = TextToCopy;
    document.body.appendChild(TempText);
    TempText.select();
    
    document.execCommand("copy");
    document.body.removeChild(TempText);
  }

  var timeout = null;
  var actionTimeout = null;

  return (
      <div className="App">
        <div className="document-editor">
          <Topbar documentName={prototypeConfig.documentName}
            description={prototypeConfig.documentDescription}
          />
          {!mergeActiveState && html && <div className="zoom_toolbar">
            <Row>
              <Col xs={8}>
              </Col>
              <Col style={{padding: 0}} xs={3}>
                {zoomFactorButton === 0 ? <Button variant="contained" color="primary">ORIGINAL</Button> : <Button variant="contained" color="grey" onClick={e => {setZoomFactorButton(0); zoomFunctionNew(0)}}>ORIGINAL</Button>}
                {zoomFactorButton === 1 ? <Button variant="contained" color="primary">CENTRAL SENTENCE</Button> : <Button variant="contained" color="grey" onClick={e => {setZoomFactorButton(1); zoomFunctionNew(1)}}>CENTRAL SENTENCE</Button>}
                {zoomFactorButton === 2 ? <Button variant="contained" color="primary">SUMMARY</Button> : <Button variant="contained" color="grey" onClick={e => {setZoomFactorButton(2); zoomFunctionNew(2)}}>SUMMARY</Button>}
                {zoomFactorButton === 3 ? <Button variant="contained" color="primary">KEYWORDS</Button> : <Button variant="contained" color="grey" onClick={e => {setZoomFactorButton(3); zoomFunctionNew(3)}}>KEYWORDS</Button>}
              </Col>
              <Col style={{paddingRight: '84.6px', display: 'flex', justifyContent: 'right'}} xs={1}>
                <ClipLoader loading={isLoading} size={36.5} />
                {!isLoading && <CheckLg size={36.5} />}
              </Col>
            </Row>
          </div>
          }
          {statusAction && <div className="action_toolbar" style={{backgroundColor: "#c0ffc8", verticalAlign: "middle", justifyContent: "center", alignItems: "center", display: "flex", height: "40px"}}>
              <Typography>
                {statusAction}
              </Typography>
          </div>
          }
          <div className="document-editor__editable-container">
            <Container fluid>
              <Row>
                <Col style={{ position: "relative" }} xs={8}>
                  <Container>
                    <div ref={testRef} id="ckEditorWrapper" 
                      onKeyDown={e => {clearTimeout(timeout);}}
                      onKeyUp={e => {clearTimeout(timeout); timeout = setTimeout(function() {
       if(zoomFactor > 0 && html.length > 0) zoomFunctionNew(zoomFactor);
    }, 3000); if(zoomFactor > 0) setIsLoading(true);}}
                    >
                      {mergeActiveState ? 
                        <div className="ck-blurred ck ck-content ck-editor__editable ck-rounded-corners ck-editor__editable_inline merge-view"
                            dangerouslySetInnerHTML={{ __html: mergehtml }}>
                        </div>
                        :
                      <CKEditor
                        editor={BalloonEditor}
                        config={editorConfiguration}
                        data={html}
                        onReady={editor => {
                          // You can store the "editor" and use when it is needed.
                          setEditor(editor);

                          const data = editor.getData();
                          setHtml(data);

                          if (data.length >= 0) {

                            var test;

                            if (data.length === 0) {
                              test = "";
                            } else {
                              test = data.match(/<p>(.*?)<\/p>/g).map(function (val) {
                                let vRes = val.replace(/<\/?p>/g, '');
                                return vRes.replaceAll("&nbsp;", '');
                              });
                            }

                            var testy = [];



                            if (test.length > 0) {
                              test.map(function (par) {
                                testy.push({
                                  tag: "edited",
                                  paragraph: par,
                                });
                              });
                            }
                            var c_cache = cache;

                            var cardTextCopy = cardText;

                            c_cache = c_cache.map(i => i.slice(0, testy.length));
                            cardTextCopy = cardTextCopy.slice(0, test.length);

                            for (var i = 0; i < testy.length; i++) {
                              if (c_cache[0][i] !== undefined && c_cache[0][i].paragraph.localeCompare(testy[i].paragraph) === 0) {
                                c_cache[0][i].tag = "updated";
                              } else {
                                if (testy[i]) {
                                  c_cache[0][i] = { tag: "edited", paragraph: testy[i].paragraph };
                                  c_cache[1][i] = { tag: "edited", paragraph: "" };;
                                  c_cache[2][i] = { tag: "edited", paragraph: "" };;
                                  c_cache[3][i] = { tag: "edited", paragraph: "" };;
                                  c_cache[4][i] = { tag: "edited", paragraph: "" };;
                                  c_cache[5][i] = { tag: "edited", paragraph: "" };;
                                  if (zoomFactor === 0) cardTextCopy[i] = testy[i].paragraph;
                                }
                              }
                            }

                            setCardText([...cardTextCopy]);
                            setCache([...c_cache]);
                          } else {
                            var c_cache = cache;
                            for (var i = 0; i < c_cache[0].length; i++) {
                              c_cache[0][i] = { tag: "edited", paragraph: "" };
                            }
                            setCache(c_cache);
                          }

                        }}
                        onChange={async (event, editor) => {
                          const data = editor.getData();
                          setHtml(data);

                          if (data.length >= 0) {

                            var test;

                            if (data.length === 0) {
                              test = "";
                            } else {
                              test = data.match(/<p>(.*?)<\/p>/g).map(function (val) {
                                let vRes = val.replace(/<\/?p>/g, '');
                                return vRes.replaceAll("&nbsp;", '');
                              });
                            }

                            var testy = [];



                            if (test.length > 0) {
                              test.map(function (par) {
                                testy.push({
                                  tag: "edited",
                                  paragraph: par,
                                });
                              });
                            }
                            var c_cache = cache;

                            var cardTextCopy = cardText;

                            c_cache = c_cache.map(i => i.slice(0, testy.length));
                            cardTextCopy = cardTextCopy.slice(0, test.length);

                            for (var i = 0; i < testy.length; i++) {
                              if (c_cache[0][i] !== undefined && c_cache[0][i].paragraph.localeCompare(testy[i].paragraph) === 0) {
                                c_cache[0][i].tag = "updated";
                              } else {
                                if (testy[i]) {
                                  c_cache[0][i] = { tag: "edited", paragraph: testy[i].paragraph };
                                  c_cache[1][i] = { tag: "edited", paragraph: "" };;
                                  c_cache[2][i] = { tag: "edited", paragraph: "" };;
                                  c_cache[3][i] = { tag: "edited", paragraph: "" };;
                                  c_cache[4][i] = { tag: "edited", paragraph: "" };;
                                  c_cache[5][i] = { tag: "edited", paragraph: "" };;
                                  if (zoomFactor === 0) cardTextCopy[i] = testy[i].paragraph;
                                }
                              }
                            }

                            setCardText([...cardTextCopy]);
                            setCache([...c_cache]);
                          } else {
                            var c_cache = cache;
                            for (var i = 0; i < c_cache[0].length; i++) {
                              c_cache[0][i] = { tag: "edited", paragraph: "" };
                            }
                            setCache(c_cache);
                          }
                        }}
                        onBlur={(event, editor) => {
                        }}
                        onFocus={(event, editor) => {
                        }}
                      />
                      }
                    </div>
                  </Container>
                </Col>
                {html && <Col className={classes.sidebar} xs={4}>
                  <div className="sidebar-container">
                    <DragDropContext onDragEnd={handleOnDragEnd}>
                      <Droppable droppableId="characters" isCombineEnabled>
                        {(provided) => (
                          <div className="characters" {...provided.droppableProps} ref={provided.innerRef}>
                            {cardText.map((paragraph, index) => {
                              if (paragraph !== null && paragraph !== "")
                                return (
                                  <Draggable key={index} draggableId={index.toString()} index={index} isDragDisabled={draggableDisabledState}>
                                    {(provided, snapshot) => (
                                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} isdragging={snapshot.isDragging.toString()}>
                                        <Card hoverable="true" className={mergeActiveState ? !mergeCardState[index] ? classes.root2 : classes.root : classes.root}>
                                          <CardContent>
                                            <div onClick={() => { if(mergeActiveState) return; jumpTo(index); }}>
                                            <Row>
                                              {!mergeCardState[index] ? <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                              {mergeCardState[index] &&
                                                  <span style={{ fontSize: "8pt", color: "grey" }}>
                                                    Here is a suggestion for combining these two paragraphs. If accepted, it will replace this paragraph in the full text.
                                                  </span>
                                                }
                                                {!mergeActiveState && <IconButton onClick={() => { handleDelete(index); setStatusAction("Deleted Paragraph " + (index + 1) + "!");
      clearTimeout(actionTimeout); actionTimeout = setTimeout(function() {
        setStatusAction(null);
      }, 8000); }}><Trash /></IconButton>}
                                              </div> : <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                              {mergeCardState[index] &&
                                                  <span style={{ fontSize: "8pt", color: "grey" }}>
                                                    Here is a suggestion for combining these two paragraphs. If accepted, it will replace this paragraph in the full text.
                                                  </span>
                                                }
                                                {!mergeActiveState && <IconButton onClick={() => { handleDelete(index); setStatusAction("Deleted Paragraph " + (index + 1) + "!");
      clearTimeout(actionTimeout); actionTimeout = setTimeout(function() {
        setStatusAction(null);
      }, 8000);}}><Trash /></IconButton>}
                                              </div>}
                                            </Row>
                                            <Row>
                                              <Typography dangerouslySetInnerHTML={{ __html: paragraph}}/>
                                            </Row>
                                            </div>
                                            {!mergeActiveState && zoomFactor > 0 &&
                                              <Row>
                                                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                                  <IconButton style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    flexWrap: 'wrap',
                                                    fontSize: 16,
                                                  }} onClick={() => { copyToClipboardFunction(paragraph); setStatusAction("Copied sidebar's paragraph version to clipboard!");
      clearTimeout(actionTimeout); actionTimeout = setTimeout(function() {
        setStatusAction(null);
      }, 8000);}}>
                                                    <span>Copy to Clipboard</span></IconButton>
                                                </div>
                                              </Row>
                                            }
                                          </CardContent>

                                          {mergeCardState[index] &&
                                            <div className={classes.controls}>
                                              <Button variant="secondary" onClick={() => {handleClose(index); }}>Cancel</Button>
                                              <Button variant="primary" onClick={() => { merge(par1State, par2State); setStatusAction("Replaced original paragraph with merge suggestion!");
      clearTimeout(actionTimeout); actionTimeout = setTimeout(function() {
        setStatusAction(null);
      }, 8000); handleClose(index);}}>Replace</Button>
                                              <Button variant="primary" onClick={() => { copyToClipboardFunction(cache[0][par1State].paragraph + " " + cache[0][par2State].paragraph); setStatusAction("Copied merge suggestion to your clipboard!");
      clearTimeout(actionTimeout); actionTimeout = setTimeout(function() {
        setStatusAction(null);
      }, 8000); handleClose(index);}}>Copy to Clipboard</Button>
                                            </div>
                                          }
                                        </Card>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                </Col>
                }
              </Row>
            </Container>
          </div>
        </div>
      </div>
  );
}

export default App;
