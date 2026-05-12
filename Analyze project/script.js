// script.js

let allData = []

let filteredData = []

let currentPage = 1

const rowsPerPage = 5

let salesChart

let profitChart

const csvFile = document.getElementById("csvFile")

const dropArea = document.getElementById("dropArea")

// FILE UPLOAD

csvFile.addEventListener("change", function(event){

    const file = event.target.files[0]

    processFile(file)
})

// DRAG DROP

dropArea.addEventListener("dragover", function(event){

    event.preventDefault()

    dropArea.style.borderColor = "blue"
})

dropArea.addEventListener("dragleave", function(){

    dropArea.style.borderColor = "#999"
})

dropArea.addEventListener("drop", function(event){

    event.preventDefault()

    const file = event.dataTransfer.files[0]

    processFile(file)
})

// PROCESS FILE

function processFile(file)
{
    if(!file.name.endsWith(".csv"))
    {
        alert("Invalid CSV File")

        return
    }

    const reader = new FileReader()

    reader.onload = function(e)
    {
        const csvData = e.target.result

        allData = parseCSV(csvData)

        filteredData = [...allData]

        loadCategories()

        updateDashboard()
    }

    reader.readAsText(file)
}

// PARSE CSV

function parseCSV(data)
{
    const rows = data.trim().split("\n")

    const result = []

    for(let i=1; i<rows.length; i++)
    {
        const columns = rows[i].split(",")

        // EMPTY ROW CLEANING

        if(columns.length < 5)
        {
            continue
        }

        const sales = Number(columns[3])

        const profit = Number(columns[4])

        // INVALID DATA CLEANING

        if(isNaN(sales) || isNaN(profit))
        {
            continue
        }

        result.push({

            product: columns[0],

            category: columns[1],

            region: columns[2],

            sales: sales,

            profit: profit
        })
    }

    return result
}

// UPDATE DASHBOARD

function updateDashboard()
{
    renderKPIs()

    renderTable()

    renderCharts()
}

// ANIMATED KPI

function animateValue(id, value)
{
    let start = 0

    const element = document.getElementById(id)

    const interval = setInterval(function(){

        start += Math.ceil(value / 30)

        if(start >= value)
        {
            start = value

            clearInterval(interval)
        }

        element.textContent = start

    },20)
}

// KPI RENDER

function renderKPIs()
{
    const totalSales =
        filteredData.reduce((sum,item)=>sum + item.sales,0)

    const totalProfit =
        filteredData.reduce((sum,item)=>sum + item.profit,0)

    const totalOrders =
        filteredData.length

    animateValue("totalSales", totalSales)

    animateValue("totalProfit", totalProfit)

    animateValue("totalOrders", totalOrders)
}

// TABLE

function renderTable()
{
    const tableBody =
        document.getElementById("tableBody")

    tableBody.innerHTML = ""

    const start =
        (currentPage - 1) * rowsPerPage

    const end =
        start + rowsPerPage

    const pageData =
        filteredData.slice(start,end)

    pageData.forEach(item=>{

        tableBody.innerHTML += `

            <tr>

                <td>${item.product}</td>

                <td>${item.category}</td>

                <td>${item.region}</td>

                <td>${item.sales}</td>

                <td>${item.profit}</td>

            </tr>

        `
    })

    document.getElementById("pageNumber")
    .textContent = currentPage
}

// CHARTS

function renderCharts()
{
    const categorySales = {}

    const regionProfit = {}

    filteredData.forEach(item=>{

        // CATEGORY SALES

        if(categorySales[item.category])
        {
            categorySales[item.category] += item.sales
        }
        else
        {
            categorySales[item.category] = item.sales
        }

        // REGION PROFIT

        if(regionProfit[item.region])
        {
            regionProfit[item.region] += item.profit
        }
        else
        {
            regionProfit[item.region] = item.profit
        }
    })

    // DESTROY OLD CHARTS

    if(salesChart)
    {
        salesChart.destroy()
    }

    if(profitChart)
    {
        profitChart.destroy()
    }

    // SALES CHART

    salesChart = new Chart(

        document.getElementById("salesChart"),

        {
            type:"bar",

            data:{

                labels:Object.keys(categorySales),

                datasets:[{

                    label:"Sales",

                    data:Object.values(categorySales),

                    borderWidth:1
                }]
            },

            options:{

                responsive:true,

                plugins:{

                    legend:{
                        display:true
                    }
                }
            }
        }
    )

    // PIE CHART WITH VALUES

    profitChart = new Chart(

        document.getElementById("profitChart"),

        {
            type:"pie",

            data:{

                labels:Object.keys(regionProfit),

                datasets:[{

                    label:"Profit",

                    data:Object.values(regionProfit),

                    borderWidth:1
                }]
            },

            options:{

                responsive:true,

                plugins:{

                    legend:{
                        position:"bottom"
                    },

                    tooltip:{
                        callbacks:{
                            label:function(context){

                                return context.label +
                                " : ₹" +
                                context.raw
                            }
                        }
                    }
                }
            },

            plugins:[{

                id:"valueDisplay",

                afterDraw(chart)
                {
                    const ctx = chart.ctx

                    ctx.save()

                    ctx.font = "bold 14px Arial"

                    // DARK MODE SUPPORT

                    if(document.body.classList.contains("dark"))
                    {
                        ctx.fillStyle = "white"
                    }
                    else
                    {
                        ctx.fillStyle = "black"
                    }

                    ctx.textAlign = "center"

                    ctx.textBaseline = "middle"

                    chart.getDatasetMeta(0).data.forEach(

                        function(element,index){

                            const value =
                                chart.data.datasets[0]
                                .data[index]

                            const position =
                                element.tooltipPosition()

                            ctx.fillText(

                                value,

                                position.x,

                                position.y
                            )
                        }
                    )

                    ctx.restore()
                }
            }]
        }
    )
}

// LOAD CATEGORY FILTER

function loadCategories()
{
    const categoryFilter =
        document.getElementById("categoryFilter")

    const categories =
        [...new Set(allData.map(item=>item.category))]

    categoryFilter.innerHTML =
        `<option value="All">All Categories</option>`

    categories.forEach(category=>{

        categoryFilter.innerHTML += `

            <option value="${category}">
                ${category}
            </option>

        `
    })
}

// FILTERS

document.getElementById("searchInput")
.addEventListener("keyup",applyFilters)

document.getElementById("categoryFilter")
.addEventListener("change",applyFilters)

function applyFilters()
{
    const search =
        document.getElementById("searchInput")
        .value.toLowerCase()

    const category =
        document.getElementById("categoryFilter")
        .value

    filteredData = allData.filter(item=>{

        const matchSearch =
            item.product.toLowerCase().includes(search)

        const matchCategory =
            category === "All" ||
            item.category === category

        return matchSearch && matchCategory
    })

    currentPage = 1

    updateDashboard()
}

// PAGINATION

document.getElementById("nextBtn")
.addEventListener("click",function(){

    const totalPages =
        Math.ceil(filteredData.length / rowsPerPage)

    if(currentPage < totalPages)
    {
        currentPage++

        renderTable()
    }
})

document.getElementById("prevBtn")
.addEventListener("click",function(){

    if(currentPage > 1)
    {
        currentPage--

        renderTable()
    }
})

// EXPORT CSV

document.getElementById("exportBtn")
.addEventListener("click",function(){

    let csv =
        "Product,Category,Region,Sales,Profit\n"

    filteredData.forEach(item=>{

        csv +=
        `${item.product},
${item.category},
${item.region},
${item.sales},
${item.profit}\n`
    })

    const blob =
        new Blob([csv], {type:"text/csv"})

    const url =
        window.URL.createObjectURL(blob)

    const a =
        document.createElement("a")

    a.href = url

    a.download = "report.csv"

    a.click()
})

// DARK MODE

document.getElementById("themeBtn")
.addEventListener("click",function(){

    document.body.classList.toggle("dark")

    renderCharts()
})