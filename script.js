// Elementos dos campos
const tipoVendaSelectNovo = document.getElementById('tipo_venda_select_novo');
const tipoVendaPrintValor = document.getElementById('tipo_venda_print_valor');
const dataEntregaNovo = document.getElementById('data_entrega_novo');
const rotaNovo = document.getElementById('rota_novo');
const pedidoAntigoInput = document.getElementById('pedido_antigo');
const outroEnderecoCheckNovo = document.getElementById('outro_endereco_check_novo');
const novoEnderecoNovo = document.getElementById('novo_endereco_novo');
const reincidenciaCheckNovo = document.getElementById('reincidencia_check_novo');
const descricaoProblemaNovo = document.getElementById('descricao_problema_novo');

// Campos da seção "Informações da perda"
const setorMaquinaInput = document.getElementById('setor_maquina');
const turnoPerdaSelect = document.getElementById('turno_perda');
const funcionarioPerdaInput = document.getElementById('funcionario_perda');

// Container principal e elementos de print
const containerPrincipal = document.querySelector('.container');
const reincidenciaAvisoPrint = document.getElementById('reincidenciaAvisoPrint');
const printNovoEnderecoContainer = document.getElementById('printNovoEnderecoContainer');
const printNovoEnderecoValor = document.getElementById('printNovoEnderecoValor');

// Elementos do Relatório Antigo
const relatorioAntigoInput = document.getElementById('relatorio_antigo_input');
const previewRelatorioAntigoContainer = document.getElementById('preview_relatorio_antigo_container');
const relatorioAntigoImgPreview = document.getElementById('relatorio_antigo_img_preview');
const deleteRelatorioAntigoBtn = document.getElementById('delete_relatorio_antigo_btn');
let relatorioAntigoFile = null;

// Elementos de Evidência do Problema
const evidenciaProblemaNovoInput = document.getElementById('evidencia_problema_novo');
const previewEvidenciaContainerNovo = document.getElementById('preview_evidencia_container_novo');
let evidenciaFiles = [];

// Elemento para data atual
const currentDateEl = document.getElementById('currentDate');

// --- Lógica Inicial ---
document.addEventListener('DOMContentLoaded', () => {
    if (currentDateEl) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        currentDateEl.textContent = `${day}/${month}/${year}`;
    }

    if (containerPrincipal) {
        containerPrincipal.classList.remove('container-reincidencia-ativa');
    }

    if (outroEnderecoCheckNovo && novoEnderecoNovo) {
        outroEnderecoCheckNovo.addEventListener('change', function() {
            toggleTextarea(this.checked, novoEnderecoNovo, true);
        });
    }

    if (reincidenciaCheckNovo && containerPrincipal) {
        reincidenciaCheckNovo.addEventListener('change', function() {
            if (this.checked) {
                containerPrincipal.classList.add('container-reincidencia-ativa');
            } else {
                containerPrincipal.classList.remove('container-reincidencia-ativa');
            }
        });
    }

    // Handler para o input de arquivo do Relatório Antigo
    if (relatorioAntigoInput) {
        relatorioAntigoInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                displayRelatorioAntigo(file);
            }
        });
    }

    // Handler para o botão de deletar do Relatório Antigo
    if (deleteRelatorioAntigoBtn) {
        deleteRelatorioAntigoBtn.addEventListener('click', clearRelatorioAntigoPreview);
        deleteRelatorioAntigoBtn.style.display = 'none'; 
    }

    // Handler para o input de evidências
    if (evidenciaProblemaNovoInput) {
        evidenciaProblemaNovoInput.addEventListener('change', function(event) {
            const newFiles = Array.from(event.target.files);
            evidenciaFiles = evidenciaFiles.concat(newFiles.filter(file => file.type.startsWith('image/')));
            renderEvidenciaPreviews();
            evidenciaProblemaNovoInput.value = '';
        });
    }
    
    // NOVO: Handler para colar imagem (Ctrl+V) no Relatório Antigo
    document.addEventListener('paste', function(event) {
        handlePaste(event);
    });

    // Lógica para auto-resize de textareas
    const textareasToAutoResize = [descricaoProblemaNovo, novoEnderecoNovo];
    textareasToAutoResize.forEach(textarea => {
        if (textarea) {
            textarea.addEventListener('input', () => autoResizeTextarea(textarea));
            if (textarea.value) {
                 autoResizeTextarea(textarea);
            }
        }
    });
});

// --- Funções Auxiliares ---

/**
 * Função para exibir a imagem do Relatório Antigo (de arquivo ou colada)
 * @param {File} file - O arquivo de imagem a ser exibido
 */
function displayRelatorioAntigo(file) {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (relatorioAntigoImgPreview) {
                relatorioAntigoImgPreview.src = e.target.result;
                relatorioAntigoImgPreview.style.display = 'block';
            }
            if (deleteRelatorioAntigoBtn) deleteRelatorioAntigoBtn.style.display = 'flex';
            relatorioAntigoFile = e.target.result; // Armazena a imagem como DataURL
            if (previewRelatorioAntigoContainer) previewRelatorioAntigoContainer.classList.remove('hidden');
            
            // Limpa o input de arquivo caso a imagem tenha vindo do paste
            if (relatorioAntigoInput) relatorioAntigoInput.value = '';
        }
        reader.readAsDataURL(file);
    }
}


/**
 * NOVO: Função para lidar com o evento de colar (paste)
 * @param {ClipboardEvent} event 
 */
function handlePaste(event) {
    const clipboardItems = event.clipboardData.items;
    let imageFile = null;

    // Itera pelos itens da área de transferência para encontrar uma imagem
    for (const item of clipboardItems) {
        if (item.type.startsWith('image/')) {
            imageFile = item.getAsFile();
            break; // Encontrou a imagem, pode parar
        }
    }

    if (imageFile) {
        // Se uma imagem foi colada, previne a ação padrão do navegador
        // e a exibe no campo do Relatório Antigo.
        event.preventDefault();
        displayRelatorioAntigo(imageFile);
    }
}


function toggleTextarea(isChecked, textareaElement, isRequired) {
    if (isChecked) {
        textareaElement.classList.remove('hidden');
        textareaElement.required = isRequired;
        autoResizeTextarea(textareaElement);
    } else {
        textareaElement.classList.add('hidden');
        textareaElement.required = false;
        textareaElement.value = '';
        autoResizeTextarea(textareaElement);
    }
}

function clearRelatorioAntigoPreview() {
    if (relatorioAntigoInput) relatorioAntigoInput.value = '';
    if (relatorioAntigoImgPreview) {
        relatorioAntigoImgPreview.src = '';
        relatorioAntigoImgPreview.style.display = 'none';
    }
    if (deleteRelatorioAntigoBtn) deleteRelatorioAntigoBtn.style.display = 'none';
    if (previewRelatorioAntigoContainer) previewRelatorioAntigoContainer.classList.add('hidden');
    relatorioAntigoFile = null;
}

function renderEvidenciaPreviews() {
    if (!previewEvidenciaContainerNovo) return;
    previewEvidenciaContainerNovo.innerHTML = '';

    if (evidenciaFiles.length > 0) {
        previewEvidenciaContainerNovo.classList.remove('hidden');
        previewEvidenciaContainerNovo.classList.toggle('has-single-image-print', evidenciaFiles.length === 1);

        evidenciaFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const wrapper = document.createElement('div');
                wrapper.classList.add('evidencia-item-wrapper');

                const imgElement = document.createElement('img');
                imgElement.src = e.target.result;
                imgElement.alt = `Evidência ${index + 1}`;
                imgElement.dataset.fileIdentifier = file.name + file.lastModified + file.size;

                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '&times;';
                deleteBtn.classList.add('delete-evidencia-btn');
                deleteBtn.title = 'Excluir esta imagem';
                deleteBtn.addEventListener('click', () => {
                    const fileIdentifier = imgElement.dataset.fileIdentifier;
                    const fileIndexToRemove = evidenciaFiles.findIndex(f => (f.name + f.lastModified + f.size) === fileIdentifier);
                    if (fileIndexToRemove > -1) {
                        evidenciaFiles.splice(fileIndexToRemove, 1);
                    }
                    renderEvidenciaPreviews();
                });

                wrapper.appendChild(imgElement);
                wrapper.appendChild(deleteBtn);
                previewEvidenciaContainerNovo.appendChild(wrapper);
            }
            reader.readAsDataURL(file);
        });
    } else {
        previewEvidenciaContainerNovo.classList.add('hidden');
        previewEvidenciaContainerNovo.classList.remove('has-single-image-print');
    }
}

function autoResizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight + 2) + 'px';
}

function imprimirRelatorio() {
    let camposValidos = true; let mensagemPrimeiroErro = "";
    const divMensagemErro = document.getElementById('mensagemErro');
    const textoMensagemErro = document.getElementById('textoMensagemErro');

    // Validation
    if (tipoVendaSelectNovo && tipoVendaSelectNovo.value === "") { camposValidos = false; if (!mensagemPrimeiroErro) mensagemPrimeiroErro = "Selecione o Tipo de Venda."; }
    if (dataEntregaNovo && !dataEntregaNovo.value) { camposValidos = false; if (!mensagemPrimeiroErro) mensagemPrimeiroErro = "Preencha a Data de Entrega."; }
    if (pedidoAntigoInput && !pedidoAntigoInput.value.trim()){ camposValidos = false; if(!mensagemPrimeiroErro) mensagemPrimeiroErro = "Preencha o Pedido Antigo."}
    
    if (outroEnderecoCheckNovo && novoEnderecoNovo && outroEnderecoCheckNovo.checked && !novoEnderecoNovo.value.trim()) {
        camposValidos = false;
        if (!mensagemPrimeiroErro) mensagemPrimeiroErro = "Preencha o Novo Endereço, pois a opção está marcada.";
    }

    if (!camposValidos) {
        if (textoMensagemErro) textoMensagemErro.textContent = `Por favor, corrija: ${mensagemPrimeiroErro}`;
        if (divMensagemErro) divMensagemErro.classList.remove('hidden');
        if (mensagemPrimeiroErro.includes("Tipo de Venda") && tipoVendaSelectNovo) tipoVendaSelectNovo.focus();
        else if (mensagemPrimeiroErro.includes("Data de Entrega") && dataEntregaNovo) dataEntregaNovo.focus();
        else if (mensagemPrimeiroErro.includes("Pedido Antigo") && pedidoAntigoInput) pedidoAntigoInput.focus();
        else if (mensagemPrimeiroErro.includes("Novo Endereço") && novoEnderecoNovo) novoEnderecoNovo.focus();
        return;
    }
    if (divMensagemErro) divMensagemErro.classList.add('hidden');

    // Prepare for print
    if (tipoVendaSelectNovo && tipoVendaPrintValor) {
        tipoVendaPrintValor.textContent = tipoVendaSelectNovo.options[tipoVendaSelectNovo.selectedIndex].text;
    }

    const descricaoProblemaTextarea = document.getElementById('descricao_problema_novo');
    const descricaoProblemaPrintArea = document.getElementById('descricao_problema_print_area');
    if (descricaoProblemaTextarea && descricaoProblemaPrintArea) {
        descricaoProblemaPrintArea.textContent = descricaoProblemaTextarea.value;
    }

    const botaoImprimir = document.querySelector('button.bg-green-600');
    const originalShadow = containerPrincipal ? containerPrincipal.style.boxShadow : '';

    if(botaoImprimir) botaoImprimir.style.display = 'none';
    if(containerPrincipal) containerPrincipal.style.boxShadow = 'none';
    
    if (reincidenciaCheckNovo && containerPrincipal && reincidenciaAvisoPrint) {
         if (reincidenciaCheckNovo.checked) {
            containerPrincipal.classList.add('container-reincidencia-ativa-print');
            reincidenciaAvisoPrint.classList.add('print-watermark-visible');
         } else {
            containerPrincipal.classList.remove('container-reincidencia-ativa-print');
            reincidenciaAvisoPrint.classList.remove('print-watermark-visible');
         }
    }
    
    if (outroEnderecoCheckNovo && novoEnderecoNovo && printNovoEnderecoContainer && printNovoEnderecoValor) {
        if (outroEnderecoCheckNovo.checked && novoEnderecoNovo.value.trim() !== '') {
            printNovoEnderecoValor.textContent = novoEnderecoNovo.value;
            printNovoEnderecoContainer.classList.add('print-visible');
        } else {
            printNovoEnderecoValor.textContent = '';
            printNovoEnderecoContainer.classList.remove('print-visible');
        }
    }

    if (relatorioAntigoFile && relatorioAntigoImgPreview) {
        if (previewRelatorioAntigoContainer) previewRelatorioAntigoContainer.style.display = 'block';
        if (relatorioAntigoImgPreview) relatorioAntigoImgPreview.style.display = 'block';
    } else {
        if (previewRelatorioAntigoContainer) previewRelatorioAntigoContainer.style.display = 'none';
        if (relatorioAntigoImgPreview) relatorioAntigoImgPreview.style.display = 'none';
    }

    if (previewEvidenciaContainerNovo) {
        previewEvidenciaContainerNovo.classList.toggle('has-single-image-print', evidenciaFiles.length === 1);
        document.querySelectorAll('.delete-evidencia-btn').forEach(btn => btn.style.display = 'none');
    }
    if (deleteRelatorioAntigoBtn) deleteRelatorioAntigoBtn.style.display = 'none';

    // DYNAMIC TITLE FOR PRINT FILENAME
    const originalTitle = document.title;
    let newTitleSet = false;
    const pedidoAntigoValue = pedidoAntigoInput.value.trim();
    const dataEntregaValue = dataEntregaNovo.value;

    if (pedidoAntigoValue && dataEntregaValue) {
        try {
            const dateParts = dataEntregaValue.split('-');
            const day = dateParts[2];
            const month = dateParts[1];
            if (day && month) {
                const formattedDateForTitle = `${day}-${month}`;
                document.title = `${pedidoAntigoValue} ${formattedDateForTitle}`;
                newTitleSet = true;
            }
        } catch (e) {
            console.error("Erro ao formatar data para o título do documento:", e);
        }
    }

    window.print();

    // --- RESTORATION LOGIC ---
    if (newTitleSet) {
        document.title = originalTitle; 
    }

    if(botaoImprimir) botaoImprimir.style.display = '';
    if(containerPrincipal) containerPrincipal.style.boxShadow = originalShadow;
    if (tipoVendaPrintValor) tipoVendaPrintValor.textContent = '';

    if (reincidenciaAvisoPrint) {
        reincidenciaAvisoPrint.classList.remove('print-watermark-visible');
    }
     if (containerPrincipal) {
        containerPrincipal.classList.remove('container-reincidencia-ativa-print');
    }
    if (printNovoEnderecoContainer) {
        printNovoEnderecoContainer.classList.remove('print-visible');
    }
    
    if (descricaoProblemaPrintArea) {
        descricaoProblemaPrintArea.textContent = '';
    }

    document.querySelectorAll('.delete-evidencia-btn').forEach(btn => btn.style.display = '');
    
    if (relatorioAntigoFile && deleteRelatorioAntigoBtn) {
        deleteRelatorioAntigoBtn.style.display = 'flex';
    } else if (deleteRelatorioAntigoBtn) {
        deleteRelatorioAntigoBtn.style.display = 'none';
    }

    if (relatorioAntigoFile && relatorioAntigoImgPreview) {
        if(previewRelatorioAntigoContainer) previewRelatorioAntigoContainer.classList.remove('hidden'); 
        if(relatorioAntigoImgPreview) relatorioAntigoImgPreview.style.display = 'block';
    } else {
        if(previewRelatorioAntigoContainer) previewRelatorioAntigoContainer.classList.add('hidden');
        if(relatorioAntigoImgPreview) relatorioAntigoImgPreview.style.display = 'none';
    }
}

// Script para o seu site (arquivo script.js) - VERSÃO CORRIGIDA PARA IMAGENS

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const pedido = params.get('pedido');
    const problema = params.get('problema');
    const imagemUrlOriginal = params.get('imagem');

    if (pedido) {
        document.getElementById('pedido_antigo').value = pedido;
    }
    if (problema) {
        document.getElementById('descricao_problema_novo').value = problema;
    }
    if (imagemUrlOriginal) {
        // A mágica acontece nesta função, que agora usa um formato mais confiável.
        const imageUrlDireto = transformaLinkDrive(imagemUrlOriginal);
        
        if (imageUrlDireto) {
            const previewContainer = document.getElementById('preview_evidencia_container_novo');
            const imgElement = document.createElement('img');
            imgElement.src = imageUrlDireto;
            imgElement.alt = 'Evidência do problema carregada da planilha';
            imgElement.className = 'w-full h-auto border rounded-md shadow-sm';
            previewContainer.innerHTML = '';
            previewContainer.appendChild(imgElement);
            previewContainer.classList.remove('hidden');
        }
    }
});

/**
 * Transforma um link padrão do Google Drive em um link direto para a imagem.
 * ESTA FUNÇÃO FOI ATUALIZADA PARA UM MÉTODO MAIS CONFIÁVEL.
 * @param {string} url - A URL original do Google Drive.
 * @returns {string|null} - A URL direta ou null se o link for inválido.
 */
function transformaLinkDrive(url) {
    let fileId = null;
    try {
        if (url.includes('open?id=')) {
            fileId = url.split('open?id=')[1].split('&')[0];
        } else if (url.includes('/d/')) {
            fileId = url.split('/d/')[1].split('/')[0];
        }
    } catch (e) {
        console.error("Não foi possível extrair o ID do arquivo da URL:", url);
        return null;
    }
    
    // Se um ID foi encontrado, retorna a URL no formato "export=view",
    // que é mais permissivo para visualização externa do que o formato "uc".
    if (fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    return null;
}

function imprimirRelatorio() {
    window.print();
}
