async function loadProjectData() {
    try {
        const response = await fetch('data/C001.json');
        const data = await response.json();
        
        // Update Project Info
        document.querySelector('.project-id').textContent = data.projectId;
        document.querySelector('.project-title h2').textContent = `${data.client} – Machine Assembly`;
        document.querySelector('.amount').textContent = `₹${data.planning.value.toLocaleString('en-IN')}`;
        
        // Update Metrics
        const spentPercent = (data.planning.budget / data.planning.value) * 100;
        document.querySelector('.spent').style.width = `${spentPercent}%`;
        document.querySelector('.budget-labels span:first-child').textContent = `Budget: ₹${data.planning.budget.toLocaleString('en-IN')}`;
        document.querySelector('.budget-labels span:last-child').textContent = `Value: ₹${data.planning.value.toLocaleString('en-IN')}`;
        
        // Update Workforce
        const workforceContainer = document.querySelector('.workforce-avatars');
        workforceContainer.innerHTML = '';
        data.metrics.workforce.forEach(worker => {
            const tag = document.createElement('div');
            tag.className = 'worker-tag';
            tag.textContent = worker;
            workforceContainer.appendChild(tag);
        });

        // Update Stages
        const stagesContainer = document.querySelector('.production-pipeline');
        stagesContainer.innerHTML = '';
        data.production.stages.forEach(stage => {
            const stageDiv = document.createElement('div');
            stageDiv.className = `stage ${stage.status.toLowerCase().replace(' ', '-')}`;
            if (stage.name === data.production.currentStage) stageDiv.classList.add('active');
            
            stageDiv.innerHTML = `
                <div class="stage-dot"></div>
                <span class="stage-name">${stage.name}</span>
            `;
            stagesContainer.appendChild(stageDiv);
        });

    } catch (error) {
        console.error('Error loading project data:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadProjectData);
