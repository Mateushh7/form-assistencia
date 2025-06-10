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
let evidencias = []; // Array unificado para arquivos (upload) e URLs (parâmetros)

// Elemento para data atual
const currentDateEl = document.getElementById('currentDate');

// --- Lógica Inicial ---
document.addEventListener('DOMContentLoaded', () => {
    // Exibe a data atual no topo da página
    if (currentDateEl) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        currentDateEl.textContent = `${day}/${month}/${year}`;
    }

    // --- LÓGICA PRINCIPAL: PREENCHER FORMULÁRIO A PARTIR DA URL ---
    preencherFormularioPelaURL();

    // Configuração inicial dos listeners de eventos
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

    if (relatorioAntigoInput) {
        relatorioAntigoInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                displayRelatorioAntigo(file);
            }
        });
    }

    if (deleteRelatorioAntigoBtn) {
        deleteRelatorioAntigoBtn.addEventListener('click', clearRelatorioAntigoPreview);
        deleteRelatorioAntigoBtn.style.display = 'none'; 
    }

    if (evidenciaProblemaNovoInput) {
        evidenciaProblemaNovoInput.addEventListener('change', function(event) {
            const newFiles = Array.from(event.target.files);
            newFiles.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const fileId = file.name + file.lastModified + file.size;
                    if (!evidencias.some(e => e.id === fileId)) {
                         evidencias.push({ type: 'file', data: file, id: fileId });
                    }
                }
            });
            renderEvidenciaPreviews();
            evidenciaProblemaNovoInput.value = '';
        });
    }
    
    document.addEventListener('paste', function(event) {
        handlePaste(event);
    });

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

/**
 * Lê os parâmetros da URL e preenche os campos do formulário.
 */
function preencherFormularioPelaURL() {
    const params = new URLSearchParams(window.location.search);

    // Preenche o campo "Pedido antigo"
    const pedidoAntigoParam = params.get('pedido_antigo');
    if (pedidoAntigoParam && pedidoAntigoInput) {
        pedidoAntigoInput.value = decodeURIComponent(pedidoAntigoParam.replace(/\+/g, ' '));
    }

    // Preenche o campo "Descrição do problema"
    const descricaoParam = params.get('descricao');
    if (descricaoParam && descricaoProblemaNovo) {
        descricaoProblemaNovo.value = decodeURIComponent(descricaoParam.replace(/\+/g, ' '));
        autoResizeTextarea(descricaoProblemaNovo); // Ajusta a altura da textarea
    }

    // Preenche a seção de "Evidências" com links do Google Drive
    const gdriveLinksParam = params.get('gdrive_links');
    if (gdriveLinksParam) {
        const urls = gdriveLinksParam.split(',');
        urls.forEach(url => {
            const trimmedUrl = url.trim();
            if (trimmedUrl) {
                const displayUrl = converterLinkGoogleDrive(trimmedUrl);
                if (displayUrl && !evidencias.some(e => e.id === displayUrl)) {
                    evidencias.push({ type: 'url', data: displayUrl, id: displayUrl });
                }
            }
        });
        renderEvidenciaPreviews(); // Renderiza as imagens dos links
    }
}

/**
 * CORRIGIDO: Converte um link de compartilhamento do Google Drive em um link de visualização direta e confiável.
 * @param {string} url - O link de compartilhamento do Google Drive.
 * @returns {string|null} - O URL de visualização direta ou null se o ID não for encontrado.
 */
function converterLinkGoogleDrive(url) {
    let fileId = null;
    
    // Tenta extrair o ID de links no formato: /file/d/FILE_ID/view
    // Ex: https://drive.google.com/file/d/1ZII1h4i-TyAVtIhSX2kJdNWXP9akHNuw/view?usp=sharing
    const matchD = url.match(/\/d\/([a-zA-Z0-9_-]{28,})/);
    if (matchD && matchD[1]) {
        fileId = matchD[1];
    } else {
        // Tenta extrair o ID de links no formato: /open?id=FILE_ID
        // Ex: https://drive.google.com/open?id=1ZII1h4i-TyAVtIhSX2kJdNWXP9akHNuw
        const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]{28,})/);
        if (matchId && matchId[1]) {
            fileId = matchId[1];
        }
    }
    
    if (fileId) {
        // Usa o formato de URL mais confiável para embutir imagens
        return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    
    console.warn('Não foi possível extrair o ID do arquivo do Google Drive do link:', url);
    return null;
}


/**
 * Renderiza as visualizações de todas as evidências (arquivos e URLs).
 */
function renderEvidenciaPreviews() {
    if (!previewEvidenciaContainerNovo) return;
    previewEvidenciaContainerNovo.innerHTML = '';

    if (evidencias.length > 0) {
        previewEvidenciaContainerNovo.classList.remove('hidden');
        previewEvidenciaContainerNovo.classList.toggle('has-single-image-print', evidencias.length === 1);

        evidencias.forEach(item => {
            const wrapper = document.createElement('div');
            wrapper.classList.add('evidencia-item-wrapper');

            const imgElement = document.createElement('img');
            imgElement.alt = `Evidência`;
            // Adiciona um handler de erro para o caso da imagem não carregar
            imgElement.onerror = function() {
                this.alt = 'Falha ao carregar imagem';
                this.src = 'https://placehold.co/250x250/e9ecef/6c757d?text=Erro!';
            };

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '&times;';
            deleteBtn.classList.add('delete-evidencia-btn');
            deleteBtn.title = 'Excluir esta imagem';
            deleteBtn.addEventListener('click', () => deletarEvidencia(item.id));
            
            wrapper.appendChild(imgElement);
            wrapper.appendChild(deleteBtn);
            previewEvidenciaContainerNovo.appendChild(wrapper);

            if (item.type === 'file') {
                const reader = new FileReader();
                reader.onload = (e) => { imgElement.src = e.target.result; };
                reader.readAsDataURL(item.data);
            } else if (item.type === 'url') {
                imgElement.src = item.data;
            }
        });
    } else {
        previewEvidenciaContainerNovo.classList.add('hidden');
        previewEvidenciaContainerNovo.classList.remove('has-single-image-print');
    }
}

/**
 * Deleta uma evidência do array 'evidencias' pelo seu ID e renderiza novamente.
 * @param {string} id - O identificador único da evidência a ser removida.
 */
function deletarEvidencia(id) {
    const indexToRemove = evidencias.findIndex(e => e.id === id);
    if (indexToRemove > -1) {
        evidencias.splice(indexToRemove, 1);
        renderEvidenciaPreviews();
    }
}

// --- Funções Auxiliares e de Impressão (sem alterações) ---

function displayRelatorioAntigo(file) {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (relatorioAntigoImgPreview) {
                relatorioAntigoImgPreview.src = e.target.result;
                relatorioAntigoImgPreview.style.display = 'block';
            }
            if (deleteRelatorioAntigoBtn) deleteRelatorioAntigoBtn.style.display = 'flex';
            relatorioAntigoFile = e.target.result; 
            if (previewRelatorioAntigoContainer) previewRelatorioAntigoContainer.classList.remove('hidden');
            
            if (relatorioAntigoInput) relatorioAntigoInput.value = '';
        }
        reader.readAsDataURL(file);
    }
}

function handlePaste(event) {
    const clipboardItems = event.clipboardData.items;
    let imageFile = null;

    for (const item of clipboardItems) {
        if (item.type.startsWith('image/')) {
            imageFile = item.getAsFile();
            break; 
        }
    }

    if (imageFile) {
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

function autoResizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight + 2) + 'px';
}

function imprimirRelatorio() {
    let camposValidos = true; let mensagemPrimeiroErro = "";
    const divMensagemErro = document.getElementById('mensagemErro');
    const textoMensagemErro = document.getElementById('textoMensagemErro');

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
        previewEvidenciaContainerNovo.classList.toggle('has-single-image-print', evidencias.length === 1);
        document.querySelectorAll('.delete-evidencia-btn').forEach(btn => btn.style.display = 'none');
    }
    if (deleteRelatorioAntigoBtn) deleteRelatorioAntigoBtn.style.display = 'none';

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

    // --- Lógica de Restauração Pós-impressão ---
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
