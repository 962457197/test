// Editor.Panel.extend({
//     style: `
//       :host { margin: 5px; }
//       h2 { color: #f90; }
//     `,
  
//     template: `
//       <h2>输入打包关卡</h2>
//       <ui-num-input id = levelInput="Search..."></ui-num-input>
//       <ui-button id="btn">点击</ui-button>
//       <hr />
//       <div>状态: <span id="label">--</span></div>
//     `,
  
//     $: {
//       btn: '#btn',
//       label: '#label',
//       levelInput: '#levelInput',
//     },
  
//     ready () {
//       this.$btn.addEventListener('confirm', () => {
//         this.$label.innerText = '你好';
//         setTimeout(() => {
//           this.$label.innerText = '--';
//         }, 500);
//       });
//     },
//   });