export const getCustomStyles = () => {
  return `
    .adminjs_Logo {
      justify-content: start !important;
    }
    .adminjs_Logo > img {
      max-height: 40px !important;
    }
    .asset-root {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .asset-root:hover .asset-action {
      visibility: visible;
    }
    .asset-action {
      visibility: hidden;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      margin: auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .dashboard-stats-card {
      flex: 1;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 32px;
      border-radius: 4px;
    }
    .dashboard-stats-heading {
      font-size: 42px;
      font-weight: 700;
    }
    .dashboard-link-card {
      text-decoration: none;
      flex: 1 1 22%;
    }
      

/* Basic button styling */
.adminjs_Button,
.adminjs_ButtonLink {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  border: 1px solid transparent;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
  text-decoration: none;
}

.adminjs_Button--primary {
  background-color: #007bff;
  border-color: #007bff;
  color: #fff;
}

.adminjs_Button--danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
}

.adminjs_Button--success {
  background-color: #28a745;
  border-color: #28a745;
  color: #fff;
}

.adminjs_Button:hover {
  filter: brightness(90%);
}

/* Text inputs */
.adminjs_Input,
.adminjs_Textarea {
  display: block !important;
  width: 100% !important;
  padding: 0.375rem 0.75rem !important;
  font-size: 1rem !important;
  line-height: 1.5 !important;
  color: #495057 !important;
  background-color: #fff !important;
  background-clip: padding-box !important;
  border: 1px solid #ced4da;
  border-radius: 0.25rem !important;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out !important;
}

.adminjs_Input:focus,
.adminjs_Textarea:focus {
  border-color: #80bdff !important;
  outline: 0 !important;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25) !important;
}

/* Select */
.adminjs_Select {
  display: block;
  width: 100%;
  padding: 0.375rem 1.75rem 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  color: #495057;
  background-color: #fff;
  background-image: url("data:image/svg+xml,..."); /* custom icon if needed */
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  appearance: none;
}

/* Checkbox and Radio */
.adminjs_Checkbox,
.adminjs_Radio {
  display: inline-block;
  margin-right: 0.5rem;
}

/* Form group and label */
.adminjs_FormGroup {
  margin-bottom: 1rem;
}

.adminjs_FormLabel {
  display: inline-block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}
/* Table styling */
.adminjs_Table {
  width: 100% !important;
  margin-bottom: 1rem !important;
  color: #212529 !important;
  border-collapse: collapse !important;
}

.adminjs_Table th,
.adminjs_Table td {
  padding: 0.75rem !important;
  vertical-align: top !important;
  border-top: 1px solid #dee2e6 !important;
}

.adminjs_Table thead th {
  vertical-align: bottom !important;
  border-bottom: 2px solid #dee2e6 !important;
  background-color: #f8f9fa !important;
}

.adminjs_Table tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05) !important;
}
/* Modal styling */
.adminjs_Modal {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1050;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
}

.adminjs_ModalDialog {
  max-width: 500px;
  margin: 1.75rem auto;
}

.adminjs_ModalContent {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  pointer-events: auto;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.3rem;
  outline: 0;
}

.adminjs_ModalHeader,
.adminjs_ModalFooter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.adminjs_ModalBody {
  padding: 1rem;
}

.adminjs_ModalClose {
  cursor: pointer;
}
/* Alert */
.adminjs_Alert {
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: 0.25rem;
}

.adminjs_Alert--success {
  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
}

.adminjs_Alert--danger {
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}

.adminjs_Alert--warning {
  color: #856404;
  background-color: #fff3cd;
  border-color: #ffeeba;
}
/* Pagination */
.adminjs_Pagination {
  display: flex;
  padding-left: 0;
  list-style: none;
  border-radius: 0.25rem;
}

.adminjs_PaginationItem {
  display: inline;
}

.adminjs_PaginationLink {
  position: relative;
  display: block ;
  padding: 0.5rem 0.75rem ;
  margin-left: -1px ;
  color: #007bff ;
  background-color: #fff  ;
  border: 1px solid #dee2e6 ;
}

.adminjs_PaginationLink:hover {
  color: #0056b3 ;
  text-decoration: none ;
  background-color: #e9ecef ;
}

ul {
  padding-left: 0 !important;
}
.tooltip-container {
  position: relative;
  display: inline-block;
}

.tooltip {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1;
  bottom: 100%; /* Adjust the position */
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px; /* Space between tooltip and element */
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  width: 300px;
}

.tooltip-container:hover .tooltip {
  opacity: 1;
}
  `
}
