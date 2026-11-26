// Owner: Member 06
// TODO: implement

const checkLabels = {
  required_name: "Required customer name",
  unique_email: "Unique email",
  valid_status: "Valid customer status",
};

export default function TestResultTable({ results }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th scope="col">Check</th>
            <th scope="col">Result</th>
            <th scope="col">Expected</th>
            <th scope="col">Actual</th>
            <th scope="col">Checked at</th>
          </tr>
        </thead>

        <tbody>
          {results.map((result) => (
            <tr key={result.id}>
              <td>{checkLabels[result.check_name] || result.check_name}</td>
              <td>
                <span className={`integrity-badge result-${result.status}`}>
                  {result.status}
                </span>
              </td>
              <td>{result.expected_result}</td>
              <td>{result.actual_result}</td>
              <td>{result.checked_at.replace("T", " ")}</td>
            </tr>
          ))}

          {results.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-state">
                No check results yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
