function formatDate(date)
{
	var strDate = "";
	var aux = date.getDate();
	if(aux < 10)
		strDate = "0";
	strDate += aux + "/";

	aux = date.getMonth() + 1;
	if(aux < 10)
		strDate += "0";
	strDate += aux + "/" + date.getFullYear();
	return(strDate);
}


function formatSefirah(sefirah)
{
  
	var sefirot=new Array(7);
	sefirot[0]="Chesed";
	sefirot[1]="Gevurah";
	sefirot[2]="Tiferet";
	sefirot[3]="Netzah";
	sefirot[4]="Hod";
	sefirot[5]="Yesod";
	sefirot[6]="Malkut";

	return(sefirot[sefirah]);
  
}


function formatDayOfWeek(day)
{
	var weekday=new Array(7);
	weekday[0]="Domingo";
	weekday[1]="Segunda-feira";
	weekday[2]="Terça-feira";
	weekday[3]="Quarta-feira";
	weekday[4]="Quinta-feira";
	weekday[5]="Sexta-feira";
	weekday[6]="Sábado";

	return(weekday[day]);
}


function formatGenderOfDay(day)
{
	var weekday=new Array(7);
	weekday[0]="o";
	weekday[1]="a";
	weekday[2]="a";
	weekday[3]="a";
	weekday[4]="a";
	weekday[5]="a";
	weekday[6]="o";

	return(weekday[day]);
}


function dayDiff(d1, d2)
{
	d1 = d1.getTime() / 86400000;
	d2 = d2.getTime() / 86400000;
	return new Number(d2 - d1).toFixed(0);
}


function calculateCycle(difference)
{

	// Mega-ciclo = 16807 dias
	var megaCiclo = ((difference - (difference % 16807)) / 16807) + 1;
	difference -= (megaCiclo - 1) * 16807;
	// Ciclo = 2401 dias
	var ciclo = ((difference - (difference % 2401)) / 2401) + 1;
	difference -= (ciclo - 1) * 2401;
	// Ano = 343 dias
	var ano = ((difference - (difference % 343)) / 343) + 1;
	difference -= (ano - 1) * 343;
	// Mês = 49 dias
	var mes = ((difference - (difference % 49)) / 49) + 1;
	difference -= (mes - 1) * 49;
	// Semana = 7 dias
	var semana = ((difference - (difference % 7)) / 7) + 1;
	difference -= (semana - 1) * 7;
	// Dia = resto + 1
	var dia = difference + 1;
	var diaNoMes = difference + (7 * (semana - 1));
	
	var inicioMes = new Date();
	inicioMes.setMilliseconds(0);
	inicioMes.setSeconds(0);
	inicioMes.setMinutes(0);
	inicioMes.setHours(0);

	inicioMes.setDate(inicioMes.getDate() - diaNoMes);
	inicioMes.setTime(inicioMes.getTime() + inicioMes.getTimezoneOffset() * 60 * 1000);

	var meses = [];
	
	for (var m = 0; m <= 6; m++) {
		var numeroMes = ((mes - 1 + m) % 7) + 1;
		var nomeMes = formatSefirah(numeroMes - 1);
		
		var semanas = [];
		
		for (var w = 0; w <= 6; w++) {
			var inicioSemana = formatDate(inicioMes);
			inicioMes.setDate(inicioMes.getDate() + 6);
			var fimSemana = formatDate(inicioMes);
			inicioMes.setDate(inicioMes.getDate() + 1);
			var listaSemana = {
				numSemana: w,
				nomeSemana: formatSefirah(w),
				inicioSemana: inicioSemana,
				fimSemana: fimSemana,
				corrente: ( m == 0 && w == semana - 1)
			};
			semanas.push(listaSemana);
		}
		var listaMes = {
			nomeMes: nomeMes,
			semanas: semanas
		};
		meses.push(listaMes);
	}
	
	var data = {
		megaCiclo: megaCiclo,
		nomeMegaCiclo: formatSefirah(megaCiclo - 1),
		ciclo: ciclo,
		nomeCiclo: formatSefirah(ciclo - 1),
		quebraCiclo: (ano == 7 && mes != 1),
		colunaCiclo: ((8 - mes) * 2),
		proximoCiclo: formatSefirah((ciclo == 7 ? 0 : ciclo)),
		ano: ano,
		nomeAno: formatSefirah(ano - 1),
		mes: mes,
		nomeMes: formatSefirah(mes - 1),
		quebraAno: (mes != 1),
		colunaAno: ((8 - mes) * 2),
		proximoAno: formatSefirah((ano == 7 ? 0 : ano)),
		semana: semana,
		nomeSemana: formatSefirah(semana - 1),
		dia: dia,
		nomeDia: formatSefirah(dia - 1),
		meses: meses
	}
	return data;

}


exports.calcula = function (req) {

	var hoje = new Date();
	hoje.setMilliseconds(0);
	hoje.setSeconds(0);
	hoje.setMinutes(0);
	hoje.setHours(0);

	var re = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

	var dataNasc = req.data.match(re);
	var dataNascStr = dataNasc[2] + '/' + dataNasc[1] + '/' + dataNasc[3];
	
	var dataNascimento = new Date(dataNascStr);
	dataNascimento.setTime(dataNascimento.getTime() + dataNascimento.getTimezoneOffset() * 60 * 1000);
	dataNascimento.setMilliseconds(0);
	dataNascimento.setSeconds(0);
	dataNascimento.setMinutes(0);
	dataNascimento.setHours(0);

	var numeroDias = dayDiff(dataNascimento, hoje);
	
	var data = {
		nome: req.nome,
		aniversario: formatDate(dataNascimento),
		diaDaSemana: formatDayOfWeek(dataNascimento.getDay()),
		generoDiaDaSemana: formatGenderOfDay(dataNascimento.getDay()),
		hoje: formatDate(hoje),
		numeroDias: numeroDias,
		anoAbsoluto: (( numeroDias - (numeroDias % 343) ) / 343) + 1,
		ciclo: calculateCycle(numeroDias)
	}

	return data;
	
};