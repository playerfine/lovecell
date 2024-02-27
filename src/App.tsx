import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import styled from "styled-components";
import React from "react";
import clsx from "clsx";

const Container = styled('div')({
  display: 'flex',
  flexDirection: 'column',
});

const Row = styled('div')({
  display: 'flex',
});

const StyledCell = styled('div')<{ isSelected: boolean }>(({ isSelected }) => {
  return {
    display: 'flex',
    border: !isSelected ? '0.5px solid rgba(255, 255, 255, 0.85)' : '1px solid red',
    height: 30,
    minWidth: 90
  }
});

interface Props {
  isSelected: boolean
  onClick: (location: Location) => void
  x: string
  y: string
}

const Cell = React.memo((props: Props) => {
  const isSelected = props.isSelected;
  const classNames = clsx("h-[30px] min-w-[90px] d-flex", !isSelected && "border-[0.5px]", isSelected && "border border-purple-900")

  const [isEditing, setIsEditing] = useState(false);

  const onClick = () => {
    props.onClick([props.x, props.y])
    setIsEditing(true)
  }

  return (
    <div className={classNames}{...props} onClick={onClick} >
      <input className="w-full h-full p-0" />
    </div>
  )
});

type Location = Array<string>

interface Cell {
  location: Location

}

interface Row {
  cells: Array<Cell>
}


type Sheet = Array<Row>;

interface AppState {
  sheet: Sheet
  selectedCells: Array<Location>
}

function App() {
  const [sheet, setSheet] = useState<Sheet>([]);
  const [selectedCells, setSelectedCells] = useState([])
  const [isHoldingMouse, setIsHoldingMouse] = useState(false)
  const [originSelectionBox, setOriginSelectionBox] = useState([0, 0])
  const [currentSelectionBox, setCurrentSelectionBox] = useState([0, 0])

  useEffect(() => {
    (async function() {
      const sheet: Sheet = await invoke("get_sheet");
      setSheet(sheet)
    })();
  }, []);

  const test = React.useCallback(async (location: Location) => {
    const [x, y] = location;
    setSelectedCells(await invoke("select_cell", { x, y }));
  }, [])

  const isSelected = (cell: Cell) => {
    return selectedCells.some(a => cell.location.every((v, i) => v === a[i]));
  }

  const containerRef = useRef();


  const onMouseDown = (e) => {
    e.stopPropagation()
    console.log("start recording");
    setIsHoldingMouse(true)
    setOriginSelectionBox([e.nativeEvent.pageX, e.nativeEvent.pageY])
  }

  const onMouseMove = (e) => {
    if (isHoldingMouse) {
      setCurrentSelectionBox([e.pageX, e.pageY])
    }
  }

  const isInteracting = (location: Location) => {
    const [x, y] = location;
    let xPos = parseInt(x) * 90;
    let yPos = parseInt(y) * 30;

    const isInY = originSelectionBox[1] < yPos && currentSelectionBox[1] > yPos
    const isInX = originSelectionBox[0] < xPos + 45 && currentSelectionBox[0] > xPos + 45
    return isInX && isInY
  }

  const onMouseLeave = async (e) => {
    setIsHoldingMouse(false)
    setCurrentSelectionBox(undefined)
    setOriginSelectionBox(undefined)

    const cells = sheet.flatMap(x => x.cells.filter(x => isInteracting(x.location))).map(x => x.location)
    setSelectedCells(await invoke("select_cells", { cells }));
  }

  let selectionBoxStyle;

  if (originSelectionBox && currentSelectionBox) {
    selectionBoxStyle = {
      zIndex: 10,
      left: Math.min(originSelectionBox[0], currentSelectionBox[0]),
      top: Math.min(originSelectionBox[1], currentSelectionBox[1]),
      height: Math.abs(currentSelectionBox[1] - originSelectionBox[1]),
      width: Math.abs(currentSelectionBox[0] - originSelectionBox[0]),
      position: "absolute",
    }
  }


  return (
    <>
      <Container ref={containerRef} onMouseUp={onMouseLeave} onMouseMove={onMouseMove} onMouseDown={onMouseDown}>
        {isHoldingMouse && <div style={selectionBoxStyle} className="border-violet-900 bg-purple-500 border-solid border-2 border-purple-900 bg-opacity-25"></div>}
        {sheet.map(x => (
          <Row>
            {x.cells.map((c) => {
              const selected = isSelected(c)
              const [x, y] = c.location;
              return (
                <Cell x={x} y={y} onClick={test} isSelected={selected} />
              )
            })}
          </Row>
        ))}
      </Container>
    </>
  );
}

export default App;

