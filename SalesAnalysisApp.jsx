
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const SalesAnalysisApp = () => {
  const [analysis, setAnalysis] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const grouped = {};
    jsonData.forEach(row => {
      const { Distributor, Product, Customer, ...months } = row;
      if (!grouped[Distributor]) grouped[Distributor] = {};
      if (!grouped[Distributor][Product]) grouped[Distributor][Product] = {};
      grouped[Distributor][Product][Customer] = months;
    });

    const results = {};
    for (let distributor in grouped) {
      results[distributor] = { totalCustomers: 0, products: {} };
      let customersSet = new Set();
      for (let product in grouped[distributor]) {
        const customerSales = grouped[distributor][product];
        const months = Object.keys(Object.values(customerSales)[0] || {});
        const summary = [];
        let prevCustomers = null;
        let prevSales = null;

        months.forEach((month, index) => {
          const currCustomers = new Set();
          let currSales = 0;

          for (let customer in customerSales) {
            const sale = customerSales[customer][month];
            if (sale > 0) {
              currCustomers.add(customer);
              currSales += sale;
              customersSet.add(customer);
            }
          }

          if (index > 0) {
            const retained = [...prevCustomers].filter(c => currCustomers.has(c));
            const lost = [...prevCustomers].filter(c => !currCustomers.has(c));
            const added = [...currCustomers].filter(c => !prevCustomers.has(c));
            const growth = prevSales ? ((currSales - prevSales) / prevSales * 100).toFixed(2) : 0;
            const retention = prevCustomers.size ? ((retained.length / prevCustomers.size) * 100).toFixed(2) : 0;

            summary.push({
              comparison: `${months[index - 1]} vs ${month}`,
              retentionRate: retention,
              growthRate: growth,
              retainedCustomers: retained.length,
              newCustomers: added.length,
              lostCustomers: lost.length
            });
          }

          prevCustomers = currCustomers;
          prevSales = currSales;
        });

        results[distributor].products[product] = summary;
      }
      results[distributor].totalCustomers = customersSet.size;
    }

    setAnalysis(results);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Sales Analysis from Excel</h1>
      <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} />
      {analysis && Object.entries(analysis).map(([distributor, data]) => (
        <div key={distributor}>
          <h2>{distributor} - Total Customers: {data.totalCustomers}</h2>
          {Object.entries(data.products).map(([product, entries]) => (
            <div key={product}>
              <h3>Product: {product}</h3>
              <table border="1">
                <thead>
                  <tr>
                    <th>Month Comparison</th>
                    <th>Retention Rate (%)</th>
                    <th>Growth Rate (%)</th>
                    <th>Retained</th>
                    <th>New</th>
                    <th>Lost</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => (
                    <tr key={i}>
                      <td>{entry.comparison}</td>
                      <td>{entry.retentionRate}</td>
                      <td>{entry.growthRate}</td>
                      <td>{entry.retainedCustomers}</td>
                      <td>{entry.newCustomers}</td>
                      <td>{entry.lostCustomers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default SalesAnalysisApp;
