


function generate_campus(campus_stats) {
	const canvas = document.getElementById('campus_radar');
	const ctx = canvas.getContext('2d');

	const sc = $("#campus-area");
	const avg_podium = sc.find(".grid-one").find(".podium");
	const con_podium = sc.find(".grid-two").find(".podium");


	const cr_avg = campus_stats.campus_ranking_avg.filter(obj => obj.average);
	const cr_con = campus_stats.campus_ranking_connexion;

	let first = avg_podium.find(".first");
	let second = avg_podium.find(".second");
	let third = avg_podium.find(".third");
	if (cr_avg.length > 0) {
		first.find(".name").text(cr_avg[0].campus);
		first.find(".value").text(cr_avg[0].average.toFixed(2));
	}
	if (cr_avg.length > 1) {
		second.find(".name").text(cr_avg[1].campus);
		second.find(".value").text(cr_avg[1].average.toFixed(2));
	}
	if (cr_avg.length > 2) {
		third.find(".name").text(cr_avg[2].campus);
		third.find(".value").text(cr_avg[2].average.toFixed(2));
	}
	

	first = con_podium.find(".first");
	second = con_podium.find(".second");
	third = con_podium.find(".third");
	if (cr_con.length > 0) {
		first.find(".name").text(cr_con[0].campus);
		first.find(".value").text(cr_con[0].count);
	}
	if (cr_con.length > 1) {
		second.find(".name").text(cr_con[1].campus);
		second.find(".value").text(cr_con[1].count);
	}
	if (cr_con.length > 2) {
		third.find(".name").text(cr_con[2].campus);
		third.find(".value").text(cr_con[2].count);
	}

	let labels = cr_avg.map(obj => obj.campus);
	let data = cr_avg.map(obj => obj.average);

	const myChart = new Chart(ctx, {
		type: 'radar',
		data: {
			labels: labels,
			datasets: [{
				label: 'Moyenne générale',
				data: data,
				backgroundColor: [
					'rgba(255, 99, 132, 0.2)'
				],
				borderColor: [
					'rgba(255, 99, 132, 1)'
				],
				borderWidth: 2
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scale: {
				min: 0,
				max: 20
			},
			scales: {
				r: {
					ticks: {
						color: '#c6d0f5',
						backdropColor: 'rgba(0, 0, 0, 0)'
					},
					pointLabels: {
						color: 'white',
						font: {
							size: 10
						}
					}
				}
			}
		}
	});
}

function generate_connexions(connexions_stats) {
	const canvas = document.getElementById('daily_connexions');
	const ctx = canvas.getContext('2d');

	const sc = $("#stats_connexions");
	const total_box = sc.find(".total");
	const average_box = sc.find(".average");
	const campus_box = sc.find(".campus");
	const semester_box = sc.find(".semester");

	total_box.find("h1").text(connexions_stats.data.nb_connexions);
	average_box.find("h1").text(connexions_stats.data.average.toFixed(2));
	campus_box.find("h1").text(connexions_stats.data.campus);
	semester_box.find("h1").text(connexions_stats.data.best_user);

	console.log(connexions_stats.data)

	const dc_stats_reversed = connexions_stats.daily_connexions.reverse();

	let labels = dc_stats_reversed.map(obj => obj.date);
	let data = dc_stats_reversed.map(obj => obj.count);

	const myChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: labels,
			datasets: [{
				label: 'Distinct connexions',
				data: data,
				backgroundColor: [
					'rgba(255, 99, 132, 0.2)'
				],
				borderColor: [
					'rgba(255, 99, 132, 1)'
				],
				borderWidth: 2
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				y: {
					beginAtZero: true,
					grid: {
						color: "#fff1"
					}
				},
				x: {
					grid: {
						color: "#fff1"
					}
				}
			}
		}
	});
}

$(document).ready(() => {
	if (typeof stats != "object") {
		alert("Les stats sont manquantes")
	}

	console.log(stats)

	if (typeof stats["connexions"] != "undefined") {
		generate_connexions(stats["connexions"]);
	}

	if (typeof stats["campus"] != "undefined") {
		generate_campus(stats["campus"]);
	}

})
