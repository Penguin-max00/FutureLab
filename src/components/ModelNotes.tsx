import { CircleHelp, ChevronDown } from 'lucide-react';
export function ModelNotes() {
  return (
    <details className="model-notes" id="model-notes">
      <summary>
        <CircleHelp size={16} />
        Model notes{' '}
        <span>
          Assumptions & limits <ChevronDown size={15} />
        </span>
      </summary>
      <div className="model-content">
        <p>
          <strong>Experiments:</strong> Baseline uses your original inputs.
          Optimistic assumes 10% higher starting salaries, 1 percentage point
          higher annual salary growth, 10% lower living expenses, and 1
          percentage point lower expense growth. Conservative reverses these
          changes. These are illustrative assumption sets, not probabilities,
          confidence intervals, or outcome bounds. Quick adjustments apply
          afterward and input limits are disclosed when reached. Deltas compare
          against the original baseline without experiments.
        </p>
        <p>
          <strong>Education:</strong> Net annual cost is tuition plus living
          costs minus scholarships, floored at zero. Optional college cost
          growth raises tuition and living costs annually; scholarships stay
          fixed. Family contribution covers the earliest costs before borrowing.
          Unused contribution is not carried into post-graduation cash.
        </p>
        <p>
          <strong>Loans:</strong> Borrowing occurs at the start of each academic
          year. Optional in-school simple interest accrues on each year's
          borrowed principal until graduation, then is capitalized once. No
          interest on that accrued interest during study. Repayment starts
          immediately after graduation at the regular loan rate. No origination
          fees, subsidies, or income-based repayment. Monthly interest and
          payments round to cents; the final payment settles any remaining
          balance.
        </p>
        <p>
          <strong>Cash flow:</strong> Post-graduation cash starts at zero. Each
          college can have a whole-month job-search delay with zero salary;
          living costs and loan repayment continue. Starting salary is earned in
          the first working month. Salary growth runs only in working months;
          living-cost growth runs from graduation. Both use effective annual
          growth compounded monthly. Take-home income uses a flat effective tax
          rate. Negative cash represents a funding gap; no interest is charged
          on that gap.
        </p>
        <p>
          <strong>Career events:</strong> Months are counted after graduation in
          both views. Pay changes multiply the salary path; career changes
          replace the annual salary and restart its growth clock. Unemployment
          intervals pause salary and its growth, with overlapping intervals
          merged. Bills and loan payments continue. Salary changes during a
          job-search or unemployment period take effect when work resumes.
          Career-change salary inputs are explicit overrides shared by all
          presets; preset growth rates still apply. Events are user assumptions,
          not predictions.
        </p>
        <p>
          <strong>Timeline:</strong> Enrollment view starts all paths together,
          includes annual college costs and their direct funding at each
          academic year's start, and ends at the same elapsed month. Study cash
          stays zero; debt includes accrued in-school interest. Graduation view
          retains each path's original graduation origin. The horizon is
          measured from the selected origin. The first monthly budget always
          refers to each college's first post-graduation month, even if outside
          the chart horizon.
        </p>
        <p>
          <strong>Net worth:</strong> Accumulated cash minus outstanding student
          debt. No investment returns, inflation adjustment, retirement
          accounts, unemployment benefits, or other assets and debts. No career
          events and the original graduation view preserve legacy results.
          Projections are nominal dollars and deterministic scenarios, not
          forecasts. Colleges may involve different graduation dates.
          Educational use; this model does not recommend a college.
        </p>
      </div>
    </details>
  );
}
