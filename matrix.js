
// Expose data globally for use in other pages
const MATRIX_CHARACTERS = ["gorgon","Chevy","JP","Jeremy","Tea","FNFFan","Irish","Umbra",
"Rebecca","Chao","Bloo","Good Woman","Evil Man","PM73","Killer Jeremy","Pestilence","Queen of Jesters","Green Guy"];
const MATRIX_DATA = [
  [3,2,2,2,2,2,1,2,4,3,2,2,5,5,5,5,3,2],
  [2,1,2,2,2,2,2,2,2,2,2,2,5,5,3,5,5,3],
  [2,2,5,2,3,3,2,2,3,3,3,2,5,5,5,5,2,2],
  [2,2,2,5,2,2,2,2,3,4,3,2,5,5,5,5,4,3],
  [2,2,2,2,3,2,2,2,3,3,3,2,5,5,5,5,5,2],
  [3,2,2,2,2,3,2,2,5,3,2,2,5,5,4,5,3,1],
  [1,2,2,2,2,2,3,2,3,2,2,2,3,3,3,5,2,2],
  [2,2,2,2,2,2,2,2,3,3,2,2,4,4,4,4,3,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [3,3,3,3,3,3,3,3,3,4,3,3,2,1,3,3,3,3],
  [2,3,2,3,2,3,2,2,3,3,2,2,4,4,3,4,3,2],
  [2,2,2,2,2,2,2,2,3,4,2,2,5,4,3,4,3,2],
  [4,4,4,4,4,4,4,4,4,2,4,5,2,2,2,3,2,3],
  [4,4,5,4,4,5,5,4,5,1,5,5,2,3,2,4,3,3],
  [5,3,4,5,5,5,5,5,5,4,5,4,2,3,5,2,2,3],
  [5,3,3,3,3,3,3,3,2,3,5,3,3,3,2,3,3,3],
  [2,3,2,2,3,5,5,3,5,4,3,4,2,5,2,3,1,3],
];

window.onload = () => {
const characters = MATRIX_CHARACTERS;
const matrix = MATRIX_DATA;
chart.style.setProperty("--count",characters.length);
const relationshipCard = document.getElementById("relationshipCard");

const headers = [];
const names = [];

// top-left placeholder
chart.append(document.createElement("div"));

// column headers
characters.forEach((c, colIndex) => {
  const header = document.createElement("div");
  header.className="header";
  const img = document.createElement("img");
  img.src="icons/"+c.toLowerCase().replaceAll(" ","_")+"_icon.png";
  const span = document.createElement("span");
  span.textContent=c;
  header.append(img,span);
  
  header.onclick=(e)=>{
    e.stopPropagation();
    showColumnScore(header, colIndex, c);
  };
  
  chart.append(header);
  headers.push(header);
});

// row headers + cells
characters.forEach((row,rowIndex)=>{
  const nameDiv=document.createElement("div");
  nameDiv.className="name";
  const img=document.createElement("img");
  img.src="icons/"+row.toLowerCase().replaceAll(" ","_")+"_icon.png";
  const span=document.createElement("span");
  span.textContent=row;
  nameDiv.append(img,span);
  chart.append(nameDiv);
  names.push(nameDiv);

  characters.forEach((col,colIndex)=>{
    const cell=document.createElement("div");
    cell.className="cell";
    cell.dataset.row=row;
    cell.dataset.col=col;
    cell.dataset.rel=matrix[rowIndex][colIndex];

    cell.onclick=e=>{
      e.stopPropagation();
      showRelationship(cell,rowIndex,colIndex);
    };

    chart.append(cell);
  });
});

function showColumnScore(header, colIndex, characterName){
  document.querySelectorAll(".cell,.name,.header").forEach(el=>el.classList.remove("glow"));
  header.classList.add("glow");
  
  // Calculate sum of all values in the column, excluding the character's self-score
  let sum = 0;
  for(let i = 0; i < matrix.length; i++){
    // Skip the diagonal (self-score)
    if(i !== colIndex){
      sum += matrix[i][colIndex];
    }
  }
  
  relationshipCard.innerHTML=`<strong>${characterName}</strong><br>Total Column Score: ${sum}`;
  relationshipCard.classList.add("show");
  
  // Highlight all cells in the column
  document.querySelectorAll(".cell").forEach((c, idx) => {
    const cRowIndex = Math.floor(idx / characters.length);
    const cColIndex = idx % characters.length;
    c.classList.remove("dim", "muted");
    
    if(cColIndex === colIndex){
      // Same column -> muted
      c.classList.add("muted");
    } else {
      // Different column -> dimmed
      c.classList.add("dim");
    }
  });
}

function showRelationship(cell,rowIndex,colIndex){
  document.querySelectorAll(".cell,.name,.header").forEach(el=>el.classList.remove("glow"));
  names[rowIndex].classList.add("glow");
  headers[colIndex].classList.add("glow");
  relationshipCard.innerHTML=`<strong>${cell.dataset.row} ➜ ${cell.dataset.col}</strong><br>Value: ${cell.dataset.rel}`;
  relationshipCard.classList.add("show");
  // Dim all cells except those in the selected row and column
  document.querySelectorAll(".cell").forEach((c, idx) => {
    const cRowIndex = Math.floor(idx / characters.length);
    const cColIndex = idx % characters.length;
    // clear states first
    c.classList.remove("dim", "muted");

    if (cRowIndex === rowIndex && cColIndex === colIndex) {
      // clicked cell stays normal
      // nothing to do
    } else if (cRowIndex === rowIndex || cColIndex === colIndex) {
      // same row or same column -> slightly muted
      c.classList.add("muted");
    } else {
      // everything else -> heavily dimmed
      c.classList.add("dim");
    }
  });
}
// Remove dim/glow when clicking outside cells
// Remove dim/glow when clicking outside cells
document.body.addEventListener('click', e => {
  if (!e.target.classList.contains('cell')) {
    document.querySelectorAll('.cell,.name,.header').forEach(el => el.classList.remove('glow'));
    document.querySelectorAll('.cell').forEach(el => el.classList.remove('dim', 'muted'));
    relationshipCard.classList.remove('show');
  }
});

// menu toggle
document.querySelector(".menuBtn").onclick=e=>{
  e.stopPropagation();
  document.querySelector(".menu").classList.toggle("open");
};

// search
const searchBox = document.querySelector('.searchBox');
if (searchBox) {
  searchBox.addEventListener('input', e => {
    const v = e.target.value.toLowerCase();
    document.querySelectorAll('.name,.header').forEach(el => {
      el.style.display = el.textContent.toLowerCase().includes(v) ? 'flex' : 'none';
    });
  });
}

};
